import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      otpPending:      false,   // MFA in progress
      otpEmail:        null,    // which email OTP was sent to
      otpUserId:       null,    // temp user id for OTP verify

      // ── Actions ───────────────────────────────────────────────
      setOTPPending: ({ userId, email }) =>
        set({ otpPending: true, otpUserId: userId, otpEmail: email }),

      login: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          otpPending:  false,
          otpUserId:   null,
          otpEmail:    null,
        }),

      updateUser: (partial) =>
        set((state) => ({ user: { ...state.user, ...partial } })),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({
          user:            null,
          accessToken:     null,
          refreshToken:    null,
          isAuthenticated: false,
          otpPending:      false,
          otpUserId:       null,
          otpEmail:        null,
        }),

      // ── Selectors ─────────────────────────────────────────────
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name:    'andbank-auth',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage for security
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
