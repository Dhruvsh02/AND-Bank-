import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchDashboard = createAsyncThunk(
  'account/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/accounts/dashboard/')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load dashboard')
    }
  }
)

export const fetchMyAccount = createAsyncThunk(
  'account/fetchMyAccount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/accounts/my/')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load account')
    }
  }
)

const accountSlice = createSlice({
  name: 'account',
  initialState: {
    account:   null,
    dashboard: null,
    loading:   false,
    error:     null,
  },
  reducers: {
    clearAccount: (state) => {
      state.account   = null
      state.dashboard = null
      state.error     = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending,   (state) => { state.loading = true;  state.error = null })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading   = false
        state.dashboard = action.payload
        state.account   = action.payload.account
      })
      .addCase(fetchDashboard.rejected,  (state, action) => {
        state.loading = false
        state.error   = action.payload
      })
      .addCase(fetchMyAccount.pending,   (state) => { state.loading = true;  state.error = null })
      .addCase(fetchMyAccount.fulfilled, (state, action) => {
        state.loading = false
        state.account = action.payload
      })
      .addCase(fetchMyAccount.rejected,  (state, action) => {
        state.loading = false
        state.error   = action.payload
      })
  },
})

export const { clearAccount } = accountSlice.actions
export default accountSlice.reducer