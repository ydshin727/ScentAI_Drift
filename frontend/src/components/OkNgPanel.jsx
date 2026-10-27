import { okNgStats, pct } from '../utils/stats';

function Cell({ count, rate }) {
  if (count === null) return <td>-</td>;
  return (
    <td>
      {count}개 <span className="muted">({pct(rate)})</span>
    </td>
  );
}

// 기준 가스를 "정상(OK)"으로 가정했을 때 v1/v2 의 불량 통과, 정상 오판 개수를 비교한다.
export default function OkNgPanel({ v1, v2, gasName }) {
  if (!v1 || !v2) return null;
  const s1 = okNgStats(v1.matrix, v1.ref);
  const s2 = okNgStats(v2.matrix, v2.ref);
  const noNormal = s1.normal === 0;

  return (
    <div>
      {noNormal && (
        <p className="notice">
          이 배치에는 '{gasName}' 샘플이 없어 정상 오판율을 계산할 수 없습니다 (표본 없음).
        </p>
      )}
      <table className="plain">
        <thead>
          <tr>
            <th>지표 (정상 = {gasName})</th>
            <th>v1</th>
            <th>v2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>정상 샘플 수</th>
            <td>{s1.normal}개</td>
            <td>{s2.normal}개</td>
          </tr>
          <tr>
            <th>정상인데 NG로 오판</th>
            <Cell count={noNormal ? null : s1.falseNg} rate={s1.falseNgRate} />
            <Cell count={noNormal ? null : s2.falseNg} rate={s2.falseNgRate} />
          </tr>
          <tr>
            <th>불량 샘플 수</th>
            <td>{s1.defect}개</td>
            <td>{s2.defect}개</td>
          </tr>
          <tr className="emphasis">
            <th>불량인데 OK로 통과</th>
            <Cell count={s1.passed} rate={s1.passRate} />
            <Cell count={s2.passed} rate={s2.passRate} />
          </tr>
        </tbody>
      </table>
      <p className="muted small">
        예측 가스만으로 계산한 값이며, 모델 점수 임계값은 반영하지 않았습니다. 정상 기준 가스는 분석을 위한 가정입니다.
      </p>
    </div>
  );
}
