import { configureStore } from '@reduxjs/toolkit'
import accountReducer from './slices/accountSlice'

export const store = configureStore({
  reducer: {
    account: accountReducer,
    // auth is Zustand — don't add it here
  },
})