import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import petReducer from './slices/petSlice';
import notificationReducer from './slices/notificationSlice';
import cartReducer from './slices/cartSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pet: petReducer,
    notification: notificationReducer,
    cart: cartReducer,
    chat: chatReducer,
  },
});
