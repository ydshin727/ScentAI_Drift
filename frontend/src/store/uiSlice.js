import { createSlice } from '@reduxjs/toolkit';

// 페이지 간에 공유하는 화면 선택값: 비교할 배치, 정상(OK) 기준 가스(라벨 1~6)
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    selectedBatch: 10,
    referenceGas: 1,
  },
  reducers: {
    setSelectedBatch(state, action) {
      state.selectedBatch = action.payload;
    },
    setReferenceGas(state, action) {
      state.referenceGas = action.payload;
    },
  },
});

export const { setSelectedBatch, setReferenceGas } = uiSlice.actions;
export default uiSlice.reducer;
