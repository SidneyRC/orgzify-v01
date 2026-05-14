// lib/validations.ts
// Shared validation logic — used across all auth pages

// ── Password ──────────────────────────────────────────────
export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character.";
  return null;
};

// ── Email ─────────────────────────────────────────────────
export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  return null;
};

// ── Mobile ────────────────────────────────────────────────
export const validateMobile = (mobile: string): string | null => {
  if (!mobile) return "Mobile number is required.";
  if (!/^\d{10}$/.test(mobile)) return "Please enter a valid 10-digit mobile number.";
  return null;
};

// ── Name ──────────────────────────────────────────────────
export const validateName = (name: string, label = "This field"): string | null => {
  if (!name.trim()) return `${label} is required.`;
  if (name.trim().length < 2) return `${label} must be at least 2 characters.`;
  return null;
};

// ── OTP ───────────────────────────────────────────────────
export const validateOtp = (otp: string): string | null => {
  if (!otp) return "Please enter the OTP.";
  if (!/^\d{6}$/.test(otp)) return "OTP must be 6 digits.";
  return null;
};

// ── Confirm Password ──────────────────────────────────────
export const validateConfirmPassword = (password: string, confirm: string): string | null => {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
};
