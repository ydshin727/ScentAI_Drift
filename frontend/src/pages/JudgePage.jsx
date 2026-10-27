import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BATCHES, MODEL_LABEL } from '../constants';
import { useGasNames } from '../hooks';
import { getHistory, getSamples, postJudgement } from '../api';
import { setReferenceGas } from '../store/uiSlice';
import { pct } from '../utils/stats';

const PAGE_SIZE = 10;

export default function JudgePage() {
  const dispatch = useDispatch();
  const { referenceGas } = useSelector((state) => state.ui);
  const gasNames = useGasNames();

  const [batch, setBatch] = useState(10);
  const [label, setLabel] = useState('');
  const [page, setPage] = useState(0);
  const [samples, setSamples] = useState(null);
  const [threshold, setThreshold] = useState(0.5);
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSamples = useCallback(async () => {
    try {
      setError('');
      setSamples(await getSamples({ batch, label: label || undefined, page, size: PAGE_SIZE }));
    } catch (e) {
      setError(e.message);
    }
  }, [batch, label, page]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await getHistory(0, 10));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { loadSamples(); }, [loadSamples]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const judge = async (sampleId) => {
    setBusy(true);
    setSelected(sampleId);
    try {
      setError('');
      setResponse(await postJudgement({ sampleId, referenceGas, threshold }));
      await loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const totalPages = samples ? Math.max(1, Math.ceil(samples.total / PAGE_SIZE)) : 1;
  const name = (l) => gasNames[l - 1] ?? l;

  return (
    <>
      <section className="card">
        <h2>OK/NG 판정 테스트</h2>
        <p className="muted">
          샘플을 고르면 v1, v2가 각각 가스를 예측합니다. 예측 가스가 기준 가스와 같고 모델 점수가 임계값 이상이면 OK, 아니면 NG입니다.
          OK/NG는 데이터에 없는 개념이라 분석을 위해 가정한 규칙입니다. 모델 점수는 보정된 신뢰도가 아니라 랜덤 포레스트 나무들의 투표 비율입니다.
        </p>
        <div className="controls">
          <label className="field">
            정상(OK) 기준 가스
            <select value={referenceGas} onChange={(e) => dispatch(setReferenceGas(Number(e.target.value)))}>
              {gasNames.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
            </select>
          </label>
          <label className="field">
            임계값 {threshold.toFixed(2)}
            <input type="range" min="0" max="1" step="0.05" value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))} />
          </label>
          <label className="field">
            배치
            <select value={batch} onChange={(e) => { setBatch(Number(e.target.value)); setPage(0); }}>
              {BATCHES.map((b) => <option key={b} value={b}>배치 {b}</option>)}
            </select>
          </label>
          <label className="field">
            실제 가스 필터
            <select value={label} onChange={(e) => { setLabel(e.target.value); setPage(0); }}>
              <option value="">전체</option>
              {gasNames.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="notice error-text">{error}</p>}
      </section>

      <section className="card">
        <h3>샘플 선택 (총 {samples ? samples.total : '-'}개)</h3>
        <table className="plain">
          <thead>
            <tr><th>샘플</th><th>실제 가스</th><th>v1 예측 (점수)</th><th>v2 예측 (점수)</th><th /></tr>
          </thead>
          <tbody>
            {samples && samples.items.map((s) => (
              <tr key={s.sampleId} className={s.sampleId === selected ? 'selected' : ''}>
                <td>#{s.sampleId}</td>
                <td>{name(s.trueLabel)}</td>
                <td>{name(s.v1Pred)} ({s.v1Score.toFixed(2)})</td>
                <td>{name(s.v2Pred)} ({s.v2Score.toFixed(2)})</td>
                <td>
                  <button type="button" disabled={busy} onClick={() => judge(s.sampleId)}>판정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pager">
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>이전</button>
          <span>{page + 1} / {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>다음</button>
        </div>
      </section>

      {response && (
        <section className="card">
          <h3>판정 결과 (샘플 #{response.sampleId}, 배치 {response.batchId})</h3>
          <p>
            실제 가스: <b>{name(response.trueLabel)}</b> · 기준 가스: <b>{name(response.referenceGas)}</b> ·
            임계값 {response.threshold} · 정답 기준 OK/NG: <b>{response.expectedResult}</b>
          </p>
          <div className="grid-2">
            {response.results.map((r) => (
              <div key={r.modelName} className={`verdict ${r.result === 'OK' ? 'ok' : 'ng'}`}>
                <h4>{MODEL_LABEL[r.modelName] ?? r.modelName}</h4>
                <p className="big">{r.result}</p>
                <p>예측: {name(r.predictedLabel)} · 점수 {pct(r.score)}</p>
                <p className="small">{r.correct ? '정답 기준과 일치' : '정답 기준과 다름 (오판)'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h3>최근 판정 이력</h3>
        <table className="plain">
          <thead>
            <tr><th>시각</th><th>샘플</th><th>모델</th><th>예측</th><th>점수</th><th>기준</th><th>임계값</th><th>결과</th></tr>
          </thead>
          <tbody>
            {history && history.items.map((h) => (
              <tr key={h.id}>
                <td>{String(h.createdAt).replace('T', ' ').slice(0, 19)}</td>
                <td>#{h.sampleId}</td>
                <td>{h.modelName}</td>
                <td>{name(h.predictedLabel)}</td>
                <td>{h.score.toFixed(2)}</td>
                <td>{name(h.referenceGas)}</td>
                <td>{h.threshold}</td>
                <td>{h.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
