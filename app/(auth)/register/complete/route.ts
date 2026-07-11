// app/(auth)/register/complete/route.ts
// POST /register/complete
// Hash password → save users + profiles → set JWT cookie
// Post-registration: if invite token present → auto-complete spouse/share linking
// acceptShare flag controls whether to link profile or just save referral

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { sendInviteNotification } from '@/lib/sendInvite';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const { title, fullName, email, password, inviteToken, acceptShare } = await req.json();

    if (!title || !fullName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    // Generate ZY ID
    const { count } = await supabase
      .from('users').select('*', { count: 'exact', head: true });
    const zyNum = String((count || 0) + 1).padStart(3, '0');
    const zy_id = `ZY${zyNum}`;

    const password_hash = await bcrypt.hash(password, 10);
    const ip_address    = req.headers.get('x-forwarded-for') || 'unknown';

    // ── Resolve invite before insert so we can save referred_by ──────────────
    let resolvedInvite = null;
    if (inviteToken) {
      const { data: inv } = await supabase
        .from('invites')
        .select('id, type, from_user_id, created_by, to_email, status, expires_at, metadata, company_id')
        .eq('token', inviteToken)
        .eq('to_email', email)
        .in('status', ['pending', 'declined'])
        .single();
      if (inv && new Date(inv.expires_at) > new Date()) {
        resolvedInvite = { ...inv, from_user_id: inv.from_user_id || inv.created_by };
      }
      console.log('[register/complete] resolvedInvite:', resolvedInvite, 'inviteToken:', inviteToken, 'email:', email);
    }

    // Save user — include referred_by if invite found
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        zy_id,
        email,
        password_hash,
        is_email_verified: true,
        account_status:    'active',
        ip_address,
        ...(resolvedInvite ? { referred_by: resolvedInvite.from_user_id } : {}),
      })
      .select('id')
      .single();

    if (userError) {
      console.error('User insert error:', userError.message);
      return NextResponse.json({ error: 'Unable to create an account!' }, { status: 500 });
    }

    // Save basic profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({ user_id: newUser.id, title, full_name: fullName, email, relationship: 'Self', profile_status: 'active', ip_address })
      .select('id')
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError.message);
    }

    // ── Post-registration invite hook ─────────────────────────────────────────
    if (resolvedInvite && newProfile) {
      try {
        const invite = resolvedInvite;

        // Get sender details for notifications
        const { data: senderUser }    = await supabase.from('users').select('email').eq('id', invite.from_user_id).single();
        const { data: senderProfile } = await supabase.from('profiles')
          .select('id, full_name, anniversary_date').eq('user_id', invite.from_user_id).eq('relationship', 'Self').single();

        const senderFullName  = senderProfile?.full_name ?? '';
        const senderParts     = senderFullName.split(' ');
        const senderFirstName = senderParts.find((p: string) => !p.endsWith('.')) ?? senderParts[0] ?? 'Someone';
        const newUserParts    = fullName.split(' ');
        const newUserFirst    = newUserParts.find((p: string) => !p.endsWith('.')) ?? newUserParts[0] ?? 'Someone';

        if (acceptShare !== false) {
          // ── Register & Share ───────────────────────────────────────────────

          if (invite.type === 'spouse' && senderProfile) {
            const anniversaryDate = senderProfile.anniversary_date ?? null;

            // Update new user's profile — link + anniversary + shared
            await supabase.from('profiles').update({
              spouse_profile_id: senderProfile.id,
              anniversary_date:  anniversaryDate,
              is_shared:         true,
            }).eq('id', newProfile.id);

            // Update sender's profile — link + anniversary + shared
            await supabase.from('profiles').update({
              spouse_profile_id: newProfile.id,
              anniversary_date:  anniversaryDate,
              is_shared:         true,
            }).eq('id', senderProfile.id);
          }

          if (invite.type === 'company_admin_invite' && invite.company_id) {
            const { data: existingRole } = await supabase
              .from('user_roles').select('id').eq('user_id', newUser.id).eq('company_id', invite.company_id).maybeSingle()
            if (!existingRole) {
              await supabase.from('user_roles').insert({
                user_id: newUser.id, company_id: invite.company_id, role_id: 'f8b0dce1-1d12-4c1b-b52c-10d4ed473f62',
                is_active: true, assigned_by: invite.from_user_id, created_by: invite.from_user_id, created_at: new Date().toISOString(),
              })
            }
          }

          if (invite.type === 'profile_share') {
            const { profile_id, can_view, can_edit, can_enroll, can_share } = invite.metadata ?? {};
            if (profile_id) {
              const { data: existingAccess } = await supabase
                .from('profile_access').select('id')
                .eq('profile_id', profile_id).eq('granted_to_id', newUser.id).eq('granted_to_type', 'user').maybeSingle();

              if (!existingAccess) {
                await supabase.from('profile_access').insert({
                  profile_id,
                  granted_by_user_id: invite.from_user_id,
                  granted_to_id:      newUser.id,
                  granted_to_type:    'user',
                  can_view:           can_view   ?? true,
                  can_edit:           can_edit   ?? false,
                  can_enroll:         can_enroll ?? false,
                  can_share:          can_share  ?? false,
                  status:             'active',
                });
              }
            }
          }

          // Notify sender — accepted
          if (senderUser?.email) {
            await sendInviteNotification({
              to:            senderUser.email,
              toName:        senderFirstName,
              recipientName: newUserFirst,
              type:          invite.type,
              action:        'accepted',
            });
          }

        } else {
          // ── Register Only — notify sender ──────────────────────────────────
          if (senderUser?.email) {
            await sendInviteNotification({
              to:            senderUser.email,
              toName:        senderFirstName,
              recipientName: newUserFirst,
              type:          invite.type,
              action:        'registered_only',
            });
          }
        }

        // Mark invite as accepted (Register & Share) or declined (Register Only)
        await supabase.from('invites').update({
          status:      acceptShare !== false ? 'accepted' : 'declined',
          accepted_at: new Date().toISOString(),
        }).eq('token', inviteToken);

      } catch (inviteErr) {
        console.error('[register/complete] Invite hook error:', inviteErr);
      }
    }
    // ── End invite hook ───────────────────────────────────────────────────────

    // Generate JWT
    const token = await new SignJWT({ user_id: newUser.id, profile_id: newProfile?.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const parts     = fullName?.split(' ') ?? [];
    const firstName = parts.find((p: string) => !p.endsWith('.')) ?? parts[0] ?? '';
    const cookieOptions = {
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
    };

    const response = NextResponse.json({ success: true, is_complete: false });
    response.cookies.set('orgzify_token', token, { ...cookieOptions, httpOnly: true });
    response.cookies.set('zy_display', firstName, cookieOptions);
    response.cookies.set('zy_avatar',  '',        cookieOptions);
    return response;

  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Unable to create an account!' }, { status: 500 });
  }
}
