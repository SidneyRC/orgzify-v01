# ORGZIFY v01 — Project Documentation
> Last Updated: May 2026 | Stack: Next.js + TypeScript + Tailwind CSS

---

## 1. PLATFORM OVERVIEW

Orgzify is a multi-product VAS (Value-Added Service) platform. Current focus: **Events Module v01**.

### Three User Types (completely separate, no sharing)
| User Type | Module | Purpose |
|---|---|---|
| Individual / Parent | All | Registers events, owns student profiles |
| Academy | Students only | Manages students, bulk-registers for events |
| Organiser | Events only | Creates events, manages attendance, results, e-certs, goodies |

### Registration Flow
Everyone registers as **Individual → Profile Edit → Save → Home**

---

## 2. ARCHITECTURE DECISIONS

### Dashboard
- ONE universal shell for ALL users (admin, academy, organiser, individual)
- Sidebar menu items controlled by **user rights from backend**
- Theme: single theme now, built to support per-user-type themes later
- All theme tokens live in `styles.ts` — single source of truth

### User Rights
- Organiser → full organiser rights
- Organiser Staff → specific assigned access only
- Academy → full academy rights
- Academy Staff → specific assigned access only
- Rights = User Type + specific permissions. Both together.

### Routing
- ONE dashboard shell — rights controlled
- Public SEO pages separate

### Slug Formula
```
name + city + pincode
e.g. kalam-sports-academy-chennai-600001
```
- Duplicates auto-append: -01, -02 etc.
- Same formula for both Academy and Organiser

---

## 3. ROUTE MAP

### Individual / Customer
| Page | Route |
|---|---|
| My Profile | `/profile/edit` |
| Manage Profiles | `/profiles` |
| Unmapped Profiles | `/profiles/unmapped` |
| My Bookings | `/bookings` |
| Change Password | `/auth/change-password` |

### Academy (SEO + Private)
| Page | Route |
|---|---|
| Public Profile (SEO) | `/academy/[slug]` |
| Dashboard | `/academy/[slug]/dashboard` |
| Edit Profile | `/academy/[slug]/edit` |
| Students | `/academy/[slug]/students` |

### Organiser (SEO + Private)
| Page | Route |
|---|---|
| Public Profile (SEO) | `/organiser/[slug]` |
| Dashboard | `/organiser/[slug]/dashboard` |
| Edit Profile | `/organiser/[slug]/edit` |
| Events | `/organiser/[slug]/events` |

---

## 4. NAVBAR

### Desktop (Not Logged In)
Logo | Events | Features | Search | All Cities | Host Event | Get Started | Login

### Desktop (Logged In)
Logo | Events | Features | Search | All Cities | Host Event | Get Started | Hi [Name] ▾

### Hi [Name] Dropdown
- My Profile → `/profile/edit`
- Manage Profiles → `/profiles`
- My Bookings → `/bookings`
- My Academies (list + status badge) → `/academy/[slug]/dashboard`
- + Add Academy
- My Organisations (list + status badge) → `/organiser/[slug]/dashboard`
- + Add Organisation
- Change Password → `/auth/change-password`
- Log Out

### Host Event Button Behaviour
- Not logged in → Login page
- Logged in, 1 active org → direct to dashboard
- Logged in, multiple orgs → profile picker (event-enabled only)

### Get Started
- Always visible
- Purpose: Academy / Organiser registration only

---

## 5. COMPLETED FILES

### Shared Components (`components/shared/`)
| File | Purpose |
|---|---|
| OtpBoxes | OTP input boxes |
| PasswordInput | Password with show/hide |
| ResendTimer | Countdown timer |
| LockScreen | Account lock screen |
| OREV1-011-Footer | Footer — "Powered by ORGZIFY © 2026 All rights reserved." |
| OREV1-012-LogoHeader | Logo header linking to home |
| OREV1-017-StatusBadge | Status badge (Active/Pending/Draft/Rejected) |
| OREV1-018-BellDropdown | Notification bell dropdown |
| OREV1-019-AvatarDropdown | Avatar + Hi[Name] dropdown |
| OREV1-023-TypeaheadInput | Typeahead search input |
| OREV1-024-InterestTagSelector | Interest tag selector |
| OREV1-025-ProfileCompletionBar | Profile completion progress bar |
| OREV1-026-Navbar | Main navbar shell |
| OREV1-027-NavUserDropdown | Hi [Name] dropdown component |
| OREV1-028-NavMobile | Mobile hamburger menu |

### Customer Layout
| File | Location | Purpose |
|---|---|---|
| OREV1-029-CustomerLayout | `app/(customer)/layout.tsx` | Wraps all customer pages with Navbar |

### Pages
| File | Route | Purpose |
|---|---|---|
| OREV1-007-StepRequest | `/auth/forgot` | Forgot password — step 1 |
| OREV1-008-StepOtp | `/auth/otp` | Forgot password — OTP |
| OREV1-009-StepReset | `/auth/reset` | Forgot password — reset |
| OREV1-013-LoginPage | `/login` | Login |
| OREV1-014-RegisterPage | `/register` | Registration shell |
| OREV1-014A-RegisterStep1 | `/register` | Step 1 — Full Name + Email |
| OREV1-014B-RegisterStep2 | `/register` | Step 2 — OTP verification |
| OREV1-014C-RegisterStep3 | `/register` | Step 3 — Password + Terms |
| OREV1-015-ProfileEdit | `/profile/edit` | Main profile edit page ⚠️ needs split |
| OREV1-020-ManageProfiles | `/profiles` | Manage Profiles page |
| OREV1-020A-ProfileCard | `/profiles` | Profile card component |
| OREV1-021-ProfileForm | `/profiles` | Sub-profile slide-up panel |
| OREV1-021A-ContactToggles | `/profiles` | Phone / WhatsApp / Email toggles |

### Admin
| File | Purpose |
|---|---|
| AdminSidebar | Admin sidebar navigation |
| Admin Layout | Admin layout shell |
| Admin Dashboard | Admin dashboard |
| Document Config | System setup — document configuration |

---

## 6. PENDING FIXES (apply when revisiting each file)

| File | Fix Needed |
|---|---|
| OREV1-009-StepReset | Toast floating top-right (currently inside card) |
| OREV1-024-InterestTagSelector | Hardcoded INTERESTS list → must become `options` prop |
| OREV1-015-ProfileEdit | File too long (>130 lines) — split into OREV1-015A-SpousePopup, OREV1-015B-ProfileFormTop, OREV1-015C-ProfileFormBottom when next revisited |

---

## 7. PENDING BUILDS

| # | File | Purpose |
|---|---|---|
| 1 | OREV1-022 | Unmapped Profiles page (OTP entry + mapping flow) |
| 2 | Profile Completion Utility | Shared function — checks mandatory fields after login, academy click, org click |
| 3 | GitHub Setup | Version control |
| 4 | Vercel Deploy | Go live |
| 5 | Supabase | Database connection |

---

## 8. KEY FLOWS

### Registration Flow
```
Register (Full Name + Email) → OTP verification → Password + Terms
→ Account created → Popup: Add Profile or Skip
→ Add Profile: Add Member page
→ Skip: Home page
```

### Profile Completion Check (Shared Utility)
Triggers after:
- Every login
- Clicking Academy
- Clicking Organisation

If mandatory fields incomplete → redirect to `/profile/edit`

### Email Update Flow
```
User requests email change → OTP sent to NEW email
→ OTP verified → Update email across platform
```

### Spouse Invite Flow (ProfileEdit — Anniversary field)
```
User enters Anniversary Date
→ Popup: Enter spouse email (optional)
→ Send: email sent, user tagged as referror + spouse
         Toast: "Email Sent to Spouse"
→ Skip: Toast: "Email not sent to Spouse"

Spouse clicks invite link → Registration flow
→ Anniversary date auto-filled
→ After registration: Popup Add Profile or Skip
```

### Post-Save Popup (Triggers only when)
1. First time registration complete
2. User has zero sub-profiles

```
Popup: "Would you like to add a profile?"
→ Add Profile: Add Member page
→ Skip: Home page
```

### Unmapped Profile — Mapping Flow
```
User clicks Unmapped Profiles
→ OTP verification (one time for the session)
→ List of unmapped profiles shown
→ User clicks Map on a profile
→ If profile owner EXISTS in Orgzify → mapping request sent → owner must ACCEPT
→ If profile owner NOT in Orgzify → they must:
     1. Create main profile
     2. Create relevant sub-profile
     3. Then accept the mapping request
→ Once mapped → profile appears under Manage Profiles
```

---

## 9. TOAST MESSAGES

| Action | Type | Message |
|---|---|---|
| Registration created | ✅ Success | "Account created successfully!" |
| Registration failed | ❌ Error | "Unable to create an account!" |
| Email OTP verified | ✅ Success | "Email verified successfully!" |
| Profile added | ✅ Success | "Profile added successfully!" |
| Profile saved | ✅ Success | "Profile saved successfully!" |
| Profile not saved | ❌ Error | "Failed to save profile. Please try again." |
| Spouse email sent | ✅ Success | "Email Sent to Spouse" |
| Spouse email skipped | ℹ️ Info | "Email not sent to Spouse" |

> **Rule:** Every success or failure action across ALL pages must show a toaster notification — no silent actions ever.

---

## 10. PROFILE FIELDS

### Main Profile
Profile ID (read-only, ZY-XXXXXX prefix), Photo, Full Name, Mobile + WhatsApp toggle, DOB, Gender, City, Pincode, Anniversary + Spouse invite, Area of Interest (mandatory), About, Current Status (with dynamic follow-up), Referral copy link (top), Referred By (read-only, bottom)

### Sub Profile
Photo, Full Name, DOB, Gender, Relationship, City, Pincode, Current Status
- Phone: "Same as master profile" toggle — uncheck shows phone field
- WhatsApp: "Same as master profile" toggle — uncheck shows WhatsApp field
- Email: "Same as master profile" toggle — uncheck shows email field
- No Area of Interest
- No Anniversary

### Current Status Options
School Student → School Name | College Student → College Name | Working Professional → Company Name | Self Employed → Company Name | Retired → nothing | House Wife → nothing | Other → optional text

---

## 11. STATUSBADGE — HOW TO ADD NEW STATUS
Add ONE line to `STATUS_STYLES` in `components/shared/OREV1-017-StatusBadge.tsx`:
```
'StatusName': 'bg-X text-X border-X'
```
Nothing else changes anywhere.

---

## 12. EVENTS — FIRST BUILD
**Drawing Competition** (needed by July)
- Online registration
- Online submission
- Judge scoring
- Results publishing
- E-certificates
- Social media push

Other planned: Chess, Yoga, Athletics (BIB/timing/heats), Badminton

### Certificate Download
Separate Organiser module: Organiser creates certificates → maps to participants/winners → users download from their profile page.

### Profile Card → Events
Tapping a profile card opens the Event page (not yet built). Events are listed per profile showing participation history.

---

## 13. UNMAPPED PROFILE — MAPPING RULES

- **Unmapped profiles created when:** individual skips profile during booking OR skips at registration counter
- **Org / Academy** → can only map profiles of their existing customers/students
- **Registration Desk** → can map anyone
- **Profile owner EXISTS in Orgzify** → system sends mapping request → owner must ACCEPT
- **Profile owner NOT in Orgzify** → must create main profile + relevant sub-profile → then accept
- **OTP verification** triggered ONCE when user enters Unmapped Profiles section (not per mapping)
- **Only ONE mapping request** allowed at a time per unmapped profile

---

## 14. DEV RULES

- Max **130 lines** per file — split large files into sub-components
- Page load under **3 seconds**
- **SEO tags** (title, description, og tags) on every public page
- No duplicate code — shared components via `@/` imports
- **Footer** always inside the page card — never in layout
- **LogoHeader** on public/auth pages only — not on customer dashboard pages
- **Navbar** comes from Customer Layout — do not add to individual pages
- Every success or failure must show a **toaster notification**
- **Simulator buttons** always call main functions only — never duplicate logic
- **Small fixes** (1–5 lines) — tell Sidney what line to change, no new file needed
- **Mock first** — always show visual mock and get approval before writing code
- **Discuss and confirm first** — never assume, one step at a time

---

## 15. PROJECT LOCATION
```
D:\Personal\Development\orgzify-v01\
```
Last file number used: **OREV1-029**
Next file number: **OREV1-030**

---

*This document is maintained alongside development. Update after every session.*
