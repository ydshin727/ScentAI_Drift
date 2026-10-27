import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { GAS_FALLBACK } from './constants';

// 가스 이름 배열 (인덱스 0 = 라벨 1). /api/meta 가 있으면 그 값을, 없으면 기본값을 쓴다.
export function useGasNames() {
  const meta = useSelector((state) => state.results.meta);
  return useMemo(() => {
    if (meta && Array.isArray(meta.gases) && meta.gases.length === 6) {
      return [...meta.gases].sort((a, b) => a.label - b.label).map((g) => g.nameKo);
    }
    return GAS_FALLBACK;
  }, [meta]);
}
