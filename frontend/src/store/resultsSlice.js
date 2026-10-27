import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAccuracy, getConfusion, getMeta } from '../api';

// 실험 결과(정확도, 혼동행렬, 메타)는 앱 시작 시 한 번만 불러와 모든 페이지가 공유한다.
export const loadResults = createAsyncThunk('results/load', async () => {
  const [accuracy, confusion, meta] = await Promise.all([
    getAccuracy(),
    getConfusion(),
    getMeta(),
  ]);
  return { accuracy, confusion, meta };
});

const resultsSlice = createSlice({
  name: 'results',
  initialState: {
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
    accuracy: [],
    confusion: [],
    meta: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadResults.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadResults.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.accuracy = action.payload.accuracy;
        state.confusion = action.payload.confusion;
        state.meta = action.payload.meta;
      })
      .addCase(loadResults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default resultsSlice.reducer;
