// Spring Boot API 호출 모음. 주소를 바꾸려면 .env 에 VITE_API_BASE 를 지정한다.
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error('서버에 연결할 수 없습니다. Spring Boot(8080)가 실행 중인지 확인하세요.');
  }
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      const detail = body.detail || body.message;
      if (detail) message += ` - ${detail}`;
    } catch {
      // 응답 본문이 JSON이 아니면 상태 문구만 사용
    }
    throw new Error(message);
  }
  return res.json();
}

export const getAccuracy = () => request('/accuracy');
export const getConfusion = () => request('/confusion');
export const getMeta = () => request('/meta');

export const getPca = (batches, max) =>
  request(`/pca?batches=${batches.join(',')}&max=${max}`);

export const getSamples = ({ batch, label, page, size }) => {
  const params = new URLSearchParams();
  if (batch) params.set('batch', batch);
  if (label) params.set('label', label);
  params.set('page', page);
  params.set('size', size);
  return request(`/samples?${params.toString()}`);
};

export const postJudgement = (body) =>
  request('/judgements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const getHistory = (page = 0, size = 10) =>
  request(`/judgements?page=${page}&size=${size}`);
