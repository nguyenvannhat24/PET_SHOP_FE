import { createSlice } from '@reduxjs/toolkit';

const savedToken = localStorage.getItem('accessToken');
let savedUser = null;
try {
  savedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  if (savedUser && savedUser.user && typeof savedUser.user === 'object') {
    savedUser = savedUser.user;
  }
} catch (e) {
  savedUser = null;
}

const initialState = {
  user: savedUser,
  accessToken: savedToken,
  isAuthenticated: !!savedToken,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    loginFailure: (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
