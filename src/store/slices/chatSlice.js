import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeConversation: null,
  messages: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setActiveConversation, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
