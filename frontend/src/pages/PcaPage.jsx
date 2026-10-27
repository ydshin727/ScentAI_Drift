import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getPca } from '../api';
import { ALL_BATCHES, BATCH_COLORS, GAS_COLORS } from '../constants';
import { useGasNames } from '../hooks';

export default function PcaPage() {
  const gasNames = useGasNames();
  const meta = useSelector((state) => state.results.meta);
  const [batches, setBatches] = useState([1, 10]);
  const [colorBy, setColorBy] = useState('batch');
  const [points, setPoints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (batches.length === 0) { setPoints([]); return; }
    let cancelled = false;
    getPca(batches, 400)
      .then((data) => { if (!cancelled) { setPoints(data); setError(''); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [batches]);

  const toggle = (b) => setBatches((cur) => (
    cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b].sort((x, y) => x - y)
  ));

  const series = useMemo(() => {
    const groups = new Map();
    for (const p of points) {
      const key = colorBy === 'batch' ? p.batchId : p.label;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [points, colorBy]);

  const ratio = meta?.experiment?.pca_explained_variance_ratio;

  return (
    <section className="card">
      <h2>센서 데이터 분포 (PCA 2차원)</h2>
      <p className="muted">
        128개 센서 특징을 배치 1 기준으로 2차원에 투영했습니다. 같은 가스가 배치에 따라 다른 위치로 이동하면 그것이 드리프트입니다.
        {Array.isArray(ratio) && ratio.length >= 2 &&
          ` (설명된 분산: PC1 ${(ratio[0] * 100).toFixed(1)}%, PC2 ${(ratio[1] * 100).toFixed(1)}%)`}
        {' '}배치당 최대 400개만 표시합니다.
      </p>
      <div className="chips">
        {ALL_BATCHES.map((b) => (
          <button key={b} type="button" className={batches.includes(b) ? 'chip active' : 'chip'} onClick={() => toggle(b)}>
            배치 {b}
          </button>
        ))}
      </div>
      <div className="chips">
        <button type="button" className={colorBy === 'batch' ? 'chip active' : 'chip'} onClick={() => setColorBy('batch')}>배치별 색</button>
        <button type="button" className={colorBy === 'label' ? 'chip active' : 'chip'} onClick={() => setColorBy('label')}>가스별 색</button>
      </div>
      {error && <p className="notice error-text">{error}</p>}
      <ResponsiveContainer width="100%" height={460}>
        <ScatterChart margin={{ top: 12, right: 24, left: 0, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="pc1" name="PC1" />
          <YAxis type="number" dataKey="pc2" name="PC2" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          {series.map(([key, data]) => (
            <Scatter
              key={key}
              name={colorBy === 'batch' ? `배치 ${key}` : gasNames[key - 1]}
              data={data}
              fill={colorBy === 'batch' ? BATCH_COLORS[key - 1] : GAS_COLORS[key - 1]}
              fillOpacity={0.6}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </section>
  );
}
