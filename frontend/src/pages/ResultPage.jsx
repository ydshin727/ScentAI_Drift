import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ConfusionMatrix from '../components/ConfusionMatrix.jsx';
import OkNgPanel from '../components/OkNgPanel.jsx';
import {
  BATCHES, MODEL_LABEL, SMALL_SAMPLE, V1_COLOR, V2_COLOR,
} from '../constants';
import { useGasNames } from '../hooks';
import { setReferenceGas, setSelectedBatch } from '../store/uiSlice';
import { buildAccuracySeries, buildPassRateSeries, findConfusion } from '../utils/results';
import { pct } from '../utils/stats';

const percentTick = (v) => `${Math.round(v * 100)}%`;

export default function ResultPage() {
  const dispatch = useDispatch();
  const { accuracy, confusion } = useSelector((state) => state.results);
  const { selectedBatch, referenceGas } = useSelector((state) => state.ui);
  const gasNames = useGasNames();

  const { rows, baseline } = useMemo(() => buildAccuracySeries(accuracy), [accuracy]);
  const passRows = useMemo(
    () => buildPassRateSeries(confusion, referenceGas),
    [confusion, referenceGas],
  );

  const v1 = findConfusion(confusion, 'v1', selectedBatch);
  const v2 = findConfusion(confusion, 'v2', selectedBatch);
  const accOf = (model) => rows.find((r) => r.batch === selectedBatch)?.[model];
  const selectedRow = rows.find((r) => r.batch === selectedBatch);
  const refName = gasNames[referenceGas - 1];

  return (
    <>
      <section className="card">
        <h2>1. 시간이 지나면 정확도가 떨어지고, 재학습하면 회복된다</h2>
        <p className="muted">
          v1은 배치 1(가장 오래된 데이터)로만 학습했고, v2는 거기에 각 배치의 20%를 더해 재학습했습니다.
          두 모델은 같은 테스트 샘플(각 배치의 나머지 80%)로 평가했습니다.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={rows} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="batch" tickFormatter={(b) => `배치 ${b}`} />
            <YAxis domain={[0, 1]} tickFormatter={percentTick} />
            <Tooltip
              formatter={(value, name) => [pct(value), name]}
              labelFormatter={(batch, payload) => {
                const n = payload && payload[0] ? payload[0].payload.nTest : '?';
                return `배치 ${batch} (테스트 ${n}개)`;
              }}
            />
            <Legend />
            {baseline !== null && (
              <ReferenceLine
                y={baseline}
                stroke="#888"
                strokeDasharray="6 4"
                label={{ value: `같은 시기(배치 1) 교차검증 ${pct(baseline)}`, position: 'insideBottomRight', fill: '#666', fontSize: 12 }}
              />
            )}
            <Line type="monotone" dataKey="v1" name={MODEL_LABEL.v1} stroke={V1_COLOR} strokeWidth={2} dot />
            <Line type="monotone" dataKey="v2" name={MODEL_LABEL.v2} stroke={V2_COLOR} strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="card">
        <h2>2. 혼동행렬: 어떤 가스를 어떤 가스로 헷갈렸나</h2>
        <div className="chips">
          {BATCHES.map((b) => (
            <button
              key={b}
              type="button"
              className={b === selectedBatch ? 'chip active' : 'chip'}
              onClick={() => dispatch(setSelectedBatch(b))}
            >
              배치 {b}
            </button>
          ))}
        </div>
        {selectedRow && selectedRow.nTest < SMALL_SAMPLE && (
          <p className="notice">이 배치는 테스트 샘플이 {selectedRow.nTest}개로 적어 정확도가 크게 흔들릴 수 있습니다.</p>
        )}
        <div className="grid-2">
          <ConfusionMatrix title={MODEL_LABEL.v1} entry={v1} gasNames={gasNames} accuracy={accOf('v1')} />
          <ConfusionMatrix title={MODEL_LABEL.v2} entry={v2} gasNames={gasNames} accuracy={accOf('v2')} />
        </div>
        <p className="muted small">
          행은 실제 가스, 열은 모델이 답한 가스입니다. 초록은 정답(대각선), 빨강은 오답이며 진할수록 그 행에서 차지하는 비율이 높습니다.
          한 열이 진하게 몰려 있으면 모델이 그 가스로 쏠려 답한다는 뜻입니다.
        </p>
      </section>

      <section className="card">
        <h2>3. OK/NG 가정으로 보면: 불량이 통과하는 위험</h2>
        <p className="muted">
          이 데이터에는 OK/NG 정답이 없어서, 선택한 가스를 "정상 제품의 냄새"로 가정하고 계산합니다.
          모델이 정상 가스라고 답하면 OK(통과), 다른 가스라고 답하면 NG입니다.
        </p>
        <label className="field">
          정상(OK) 기준 가스
          <select value={referenceGas} onChange={(e) => dispatch(setReferenceGas(Number(e.target.value)))}>
            {gasNames.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </label>
        <p className="muted small">선택한 배치: 배치 {selectedBatch} (위 2번에서 바꿀 수 있습니다)</p>
        <OkNgPanel
          v1={v1 && { ...v1, ref: referenceGas }}
          v2={v2 && { ...v2, ref: referenceGas }}
          gasName={refName}
        />

        <h3>배치별 불량 통과율 (기준 가스: {refName})</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={passRows} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="batch" tickFormatter={(b) => `배치 ${b}`} />
            <YAxis domain={[0, 1]} tickFormatter={percentTick} />
            <Tooltip formatter={(value, name) => [pct(value), name]} labelFormatter={(b) => `배치 ${b}`} />
            <Legend />
            <Line type="monotone" dataKey="v1" name="v1 불량 통과율" stroke={V1_COLOR} strokeWidth={2} connectNulls />
            <Line type="monotone" dataKey="v2" name="v2 불량 통과율" stroke={V2_COLOR} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="card notes">
        <h2>가정과 한계</h2>
        <ul>
          <li>OK/NG는 데이터에 없는 개념이라 "기준 가스 = 정상"으로 가정한 것입니다.</li>
          <li>v2는 적응에 쓴 시기와 같은 시기를 평가했습니다. 재학습 후 더 새로운 시기에도 유지되는지는 확인하지 않았습니다.</li>
          <li>배치마다 가스 구성이 다르고(예: 톨루엔이 없는 배치), 샘플이 적은 배치가 있어 배치 간 정확도 차이가 순수한 드리프트 효과만은 아닙니다.</li>
          <li>기본 랜덤 포레스트 한 가지 설정으로 한 번 실험한 결과입니다.</li>
        </ul>
      </section>
    </>
  );
}
