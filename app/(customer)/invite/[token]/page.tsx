'use client';
// OREV1-038 — Invite Landing Page
// app/(customer)/invite/[token]/page.tsx
// Handles accept / decline for all invite types
// On load: fetch invite → check logged in user → verify correct user → show invite or redirect

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { card, btn, text } from '@/lib/styles';

type Status = 'loading' | 'valid' | 'accepted' | 'declined' | 'expired' | 'error' | 'wrong_user' | 'already_linked';

interface InviteData {
  type: string;
  fromName: string;
  toEmail: string;
  isRegistered: boolean;
  isCorrectUser: boolean | null;
}

export default function InvitePage() {
  const { token }    = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const action       = searchParams.get('action');
  const acceptShare  = searchParams.get('acceptShare') !== 'false';

  const [status,     setStatus]     = useState<Status>('loading');
  const [invite,     setInvite]     = useState<InviteData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  useEffect(() => {
    async function loadInvite() {
      try {
        const res  = await fetch(`/invite/verify?token=${token}`);
        const data = await res.json();
        if (!res.ok) { setStatus(data.expired ? 'expired' : 'error'); return; }

        const inviteUrl = `/invite/${token}${action ? `?action=${action}` : ''}`;

        // Not logged in
        if (data.isCorrectUser === null) {
          if (!data.isRegistered) {
            // Unregistered — show invite page with Register & Share / Register Only buttons
            setInvite(data);
            setStatus('valid');
          } else {
            // Registered but not logged in — go to login
            router.push(`/login?next=${encodeURIComponent(inviteUrl)}`);
          }
          return;
        }

        // Wrong user logged in — logout and redirect to login
if (data.isCorrectUser === false) {
  if (!data.isRegistered) {
    window.location.href = `/logout?next=${encodeURIComponent(`/invite/${token}`)}`;
  } else {
    window.location.href = `/logout?next=${encodeURIComponent(`/login?next=${encodeURIComponent(inviteUrl)}`)}`;
  }
  return;
}

        // Correct user — show invite and auto-process if action in URL
        setInvite(data);
        setStatus('valid');
        if (action === 'accept')  handleAction('accept',  data, acceptShare);
        if (action === 'decline') handleAction('decline', data);

      } catch { setStatus('error'); }
    }
    loadInvite();
  }, [token]);

  async function handleAction(act: 'accept' | 'decline', data?: InviteData, share = true) {
    const inviteData = data ?? invite;
    if (!inviteData) return;
    setProcessing(true);

    // Unregistered — redirect to register
    if (act === 'accept' && !inviteData.isRegistered) {
      router.push(`/register?invite=${token}&acceptShare=${share}`);
      return;
    }

    try {
      const res    = await fetch('/invite/action', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, action: act }),
      });
      const result = await res.json();

      if (res.status === 403 && result.code === 'WRONG_USER') {
        setStatus('wrong_user'); setProcessing(false); return;
      }
      if (res.status === 409 && (result.code === 'SENDER_ALREADY_LINKED' || result.code === 'RECIPIENT_ALREADY_LINKED')) {
        setStatus('already_linked'); setErrorMsg(result.error); setProcessing(false); return;
      }
      if (!res.ok) throw new Error(result.error);
      setStatus(act === 'accept' ? 'accepted' : 'declined');
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSwitchAccount() {
    window.location.href = `/logout?next=${encodeURIComponent(`/login?next=${encodeURIComponent(`/invite/${token}?action=accept`)}`)}`;
  }

  function getTypeLabel(type: string) {
    if (type === 'spouse')           return 'spouse connection';
    if (type === 'profile_transfer') return 'profile transfer';
    if (type === 'profile_share')    return 'profile share';
    return 'invitation';
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading invitation...</p>
    </div>
  );

  if (status === 'expired') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md text-center`}>
        <p className="text-4xl mb-4">⏰</p>
        <h1 className={`${text.heading} mb-2`}>Invitation Expired</h1>
        <p className="text-sm text-gray-500">This invite link is no longer valid. Please ask the sender to send a new invite.</p>
      </div>
    </div>
  );

  if (status === 'wrong_user') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md text-center`}>
        <p className="text-4xl mb-4">🔒</p>
        <h1 className={`${text.heading} mb-2`}>Wrong Account</h1>
        <p className="text-sm text-gray-500 mb-6">
          This invite was sent to a different email address. Please log in with the correct account to accept it.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={handleSwitchAccount} className={btn.primary}>Login as Someone Else</button>
          <button onClick={() => router.push('/')} className={btn.outline}>Go to Home</button>
        </div>
      </div>
    </div>
  );

  if (status === 'already_linked') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md text-center`}>
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className={`${text.heading} mb-2`}>Already Connected</h1>
        <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
        <button onClick={() => router.push('/profiles')} className={btn.primary}>Go to My Profiles</button>
      </div>
    </div>
  );

  if (status === 'accepted') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md text-center`}>
        <p className="text-4xl mb-4">✅</p>
        <h1 className={`${text.heading} mb-2`}>Invitation Accepted</h1>
        <p className="text-sm text-gray-500 mb-6">You have successfully accepted the {getTypeLabel(invite?.type ?? '')}.</p>
        <button onClick={() => router.push('/profiles')} className={btn.primary}>Go to My Profiles</button>
      </div>
    </div>
  );

  if (status === 'declined') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md text-center`}>
        <p className="text-4xl mb-4">❌</p>
        <h1 className={`${text.heading} mb-2`}>Invitation Declined</h1>
        <p className="text-sm text-gray-500">You have declined this invitation. The sender will be notified.</p>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md text-center`}>
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className={`${text.heading} mb-2`}>Something went wrong</h1>
        <p className="text-sm text-gray-500">This invite link may be invalid. Please contact support.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`${card.base} w-full max-w-md`}>
        <p className="text-4xl mb-4 text-center">💌</p>
        <h1 className={`${text.heading} text-center mb-2`}>You have an Invitation</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          <strong>{invite?.fromName}</strong> has invited you for a {getTypeLabel(invite?.type ?? '')}.
        </p>
        <div className="flex flex-col gap-3">
          {invite?.isRegistered ? (
            <>
              <button onClick={() => handleAction('accept')} disabled={processing} className={btn.primary}>
                {processing ? 'Processing...' : '✅ Accept'}
              </button>
              <button onClick={() => handleAction('decline')} disabled={processing} className={btn.outline}>
                ❌ Decline
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleAction('accept', undefined, true)} disabled={processing} className={btn.primary}>
                {processing ? 'Processing...' : '✅ Register & Share'}
              </button>
              <button onClick={() => handleAction('accept', undefined, false)} disabled={processing} className={btn.outline}>
                Register Only
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          If you did not expect this, you can safely ignore this page.
        </p>
      </div>
    </div>
  );
}
