import { accuracyOf, pct, sum } from '../utils/stats';

function cellStyle(value, rowSum, isDiagonal) {
  if (!rowSum || value === 0) return {};
  const rate = value / rowSum;
  const alpha = Math.min(0.9, 0.12 + rate * 0.78);
  return {
    background: isDiagonal
      ? `rgba(46, 160, 67, ${alpha})`
      : `rgba(214, 69, 65, ${alpha})`,
  };
}

// 행=실제 가스, 열=모델이 답한 가스. 초록=정답(대각선), 빨강=오답이며 진할수록 그 행에서 차지하는 비율이 높다.
export default function ConfusionMatrix({ title, entry, gasNames, accuracy }) {
  if (!entry) {
    return <div className="muted">이 배치의 결과가 없습니다.</div>;
  }
  const { matrix, nTest } = entry;
  const acc = accuracy ?? accuracyOf(matrix);

  return (
    <div className="cm">
      <h4>{title}</h4>
      <p className="muted small">정확도 {pct(acc)} · 테스트 {nTest}개</p>
      <table className="cm-table">
        <thead>
          <tr>
            <th>실제 \ 모델 답</th>
            {gasNames.map((name) => (
              <th key={name}>{name}</th>
            ))}
            <th>맞힌 비율</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => {
            const rowSum = sum(row);
            return (
              <tr key={gasNames[i]}>
                <th>{gasNames[i]}</th>
                {row.map((value, j) => (
                  <td
                    key={gasNames[j]}
                    style={cellStyle(value, rowSum, i === j)}
                    title={`실제 ${gasNames[i]} → 모델 답 ${gasNames[j]}: ${value}개`}
                  >
                    {rowSum ? value : '-'}
                  </td>
                ))}
                <td>{rowSum ? pct(row[i] / rowSum, 0) : '표본 없음'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
