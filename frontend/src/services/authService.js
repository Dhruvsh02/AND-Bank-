import api from './api'

const AuthService = {
  // ── Registration ───────────────────────────────────────────────
  register: (data) =>
    api.post('/auth/register/', data),           // opens account + sends OTP

  // ── Login (step 1 → triggers OTP) ─────────────────────────────
  login: (credentials) =>
    api.post('/auth/login/', credentials),

  // ── OTP Verification (step 2 → returns tokens) ────────────────
  verifyOTP: (payload) =>
    api.post('/auth/verify-otp/', payload),      // { user_id, otp }

  // ── Resend OTP ─────────────────────────────────────────────────
  resendOTP: (payload) =>
    api.post('/auth/resend-otp/', payload),      // { user_id, channel } email|sms

  // ── Token Refresh ──────────────────────────────────────────────
  refreshToken: (refresh) =>
    api.post('/auth/token/refresh/', { refresh }),

  // ── Logout ────────────────────────────────────────────────────
  logout: () =>
    api.post('/auth/logout/'),

  // ── Forgot Password ───────────────────────────────────────────
  forgotPassword: (email) =>
    api.post('/auth/forgot-password/', { email }),

  resetPassword: (payload) =>
    api.post('/auth/reset-password/', payload),  // { token, password }

  // ── Change Password ───────────────────────────────────────────
  changePassword: (payload) =>
    api.post('/auth/change-password/', payload),
}

export default AuthService
