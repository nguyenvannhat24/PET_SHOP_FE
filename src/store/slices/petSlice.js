import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pets: [],
  loading: false,
  error: null,
};

const petSlice = createSlice({
  name: 'pet',
  initialState,
  reducers: {
    setPets: (state, action) => {
      state.pets = action.payload;
    },
    addPet: (state, action) => {
      state.pets.push(action.payload);
    },
  },
});

export const { setPets, addPet } = petSlice.actions;
export default petSlice.reducer;
