import { configureStore } from '@reduxjs/toolkit';
import resultsReducer from './resultsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    results: resultsReducer,
    ui: uiReducer,
  },
});
