import { BATCHES } from '../constants';
import { okNgStats } from './stats';

// /api/accuracy 응답을 차트용 행으로 바꾼다. v1_cv5(배치 1 교차검증)는 기준선으로 따로 뺀다.
export function buildAccuracySeries(accuracy) {
  const byBatch = new Map();
  let baseline = null;
  for (const a of accuracy) {
    if (a.modelName === 'v1_cv5') {
      baseline = a.accuracy;
      continue;
    }
    const row = byBatch.get(a.batchId) || { batch: a.batchId, nTest: a.nTest };
    row[a.modelName] = a.accuracy;
    byBatch.set(a.batchId, row);
  }
  const rows = [...byBatch.values()].sort((x, y) => x.batch - y.batch);
  return { rows, baseline };
}

export function findConfusion(confusion, model, batch) {
  return confusion.find((c) => c.modelName === model && c.batchId === batch) || null;
}

// 선택한 기준 가스에 대해 배치별 "불량 통과율"을 v1, v2 로 계산한다.
export function buildPassRateSeries(confusion, ref) {
  return BATCHES.map((batch) => {
    const row = { batch };
    for (const model of ['v1', 'v2']) {
      const c = findConfusion(confusion, model, batch);
      row[model] = c ? okNgStats(c.matrix, ref).passRate : null;
    }
    return row;
  });
}
