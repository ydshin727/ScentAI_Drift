// 6x6 혼동행렬(행=실제 가스, 열=모델이 답한 가스, 라벨 1~6 순서)에서 지표를 계산한다.

export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export function totalOf(matrix) {
  return matrix.reduce((s, row) => s + sum(row), 0);
}

// 정확도 = 대각선 합 / 전체
export function accuracyOf(matrix) {
  const total = totalOf(matrix);
  if (total === 0) return null;
  const correct = matrix.reduce((s, row, i) => s + row[i], 0);
  return correct / total;
}

// 열 합계 = 모델이 해당 가스라고 답한 횟수
export function columnSums(matrix) {
  return matrix[0].map((_, j) => matrix.reduce((s, row) => s + row[j], 0));
}

/**
 * 기준 가스(ref, 1~6)를 "정상(OK)"으로 가정했을 때의 OK/NG 통계.
 * - 정상: 실제 가스가 ref 인 샘플, 불량: 그 외
 * - 불량인데 ref 로 답함 -> OK 로 통과(놓침), 정상인데 ref 가 아니라고 답함 -> NG 오판
 * 이 규칙은 예측 가스만 보며, 모델 점수 임계값은 반영하지 않는다.
 */
export function okNgStats(matrix, ref) {
  const i = ref - 1;
  const total = totalOf(matrix);
  const normal = sum(matrix[i]);
  const defect = total - normal;
  const answeredRef = columnSums(matrix)[i];
  const passed = answeredRef - matrix[i][i];
  const falseNg = normal - matrix[i][i];
  return {
    total,
    normal,
    defect,
    passed,
    falseNg,
    passRate: defect > 0 ? passed / defect : null,
    falseNgRate: normal > 0 ? falseNg / normal : null,
  };
}

export function pct(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(digits)}%`;
}

// 정렬된 값에서 [lo, hi] 분위 구간을 축 범위로 돌려준다 (이상치 때문에 그림이 눌리는 것을 방지).
export function percentileDomain(values, lo = 0.01, hi = 0.99) {
  if (values.length === 0) return ['auto', 'auto'];
  const sorted = [...values].sort((a, b) => a - b);
  const a = sorted[Math.floor(lo * (sorted.length - 1))];
  const b = sorted[Math.ceil(hi * (sorted.length - 1))];
  const pad = (b - a) * 0.05 || 1;
  return [a - pad, b + pad];
}
