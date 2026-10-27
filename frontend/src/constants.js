// 배치 2~10: v1/v2 비교 대상 (배치 1은 v1의 학습 데이터)
export const BATCHES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const ALL_BATCHES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// /api/meta 를 불러오기 전이나 실패했을 때 쓰는 가스 이름 (라벨 1~6 순서)
export const GAS_FALLBACK = ['에탄올', '에틸렌', '암모니아', '아세트알데히드', '아세톤', '톨루엔'];

export const GAS_COLORS = ['#2a7ae2', '#e08a1e', '#2e9d5b', '#a259c4', '#d6453d', '#7a7a7a'];
export const BATCH_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

export const V1_COLOR = '#d6453d';
export const V2_COLOR = '#2a7ae2';

export const MODEL_LABEL = {
  v1: 'v1 (배치 1로만 학습)',
  v2: 'v2 (배치 1 + 해당 배치 20%로 재학습)',
};

// 테스트 샘플이 이 값보다 적으면 정확도가 흔들릴 수 있다고 안내한다.
export const SMALL_SAMPLE = 200;
