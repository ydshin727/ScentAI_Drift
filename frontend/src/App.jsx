import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Route, Routes } from 'react-router-dom';
import JudgePage from './pages/JudgePage.jsx';
import PcaPage from './pages/PcaPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import { loadResults } from './store/resultsSlice';

export default function App() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.results);

  useEffect(() => {
    dispatch(loadResults());
  }, [dispatch]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>전자코 센서 드리프트 분석</h1>
          <p className="muted">
            UCI Gas Sensor Array Drift 데이터로 보는 센서 드리프트와 재학습 효과
          </p>
        </div>
        <nav>
          <NavLink to="/" end>실험 결과</NavLink>
          <NavLink to="/judge">판정 테스트</NavLink>
          <NavLink to="/pca">센서 데이터 (PCA)</NavLink>
        </nav>
      </header>

      <main>
        {status === 'failed' && (
          <div className="card error">
            <p>결과를 불러오지 못했습니다: {error}</p>
            <button type="button" onClick={() => dispatch(loadResults())}>다시 시도</button>
          </div>
        )}
        {(status === 'idle' || status === 'loading') && (
          <div className="card muted">결과를 불러오는 중입니다...</div>
        )}
        {status === 'succeeded' && (
          <Routes>
            <Route path="/" element={<ResultPage />} />
            <Route path="/judge" element={<JudgePage />} />
            <Route path="/pca" element={<PcaPage />} />
            <Route path="*" element={<div className="card">없는 페이지입니다.</div>} />
          </Routes>
        )}
      </main>
    </div>
  );
}
