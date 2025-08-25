import axios from 'axios';

const API_URL =  process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
    baseURL: `${API_URL}/journal`,
    timeout: 20000,
});

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('pjUser');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error parsing user token from localStorage:', error);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('pjUser');
      window.location.href = '/login';
    }
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

// ---------- endpoints ----------
export const analyzeJournal = async (context) => {
  const { data } = await api.post('/analyze', { context });
  return data;
};

export const createJournal = async (context, mood, insight) => {
  const { data } = await api.post('/', { context, mood, insight });
  return data;
};

export const listJournals = (page = 1, limit = 10) =>
  api.get('/journal', { params: { page, limit } }).then(r => r.data);

export const updateJournal = async (id, context) => {
  const { data } = await api.put(`/${id}`, { context });
  return data;
};

export const deleteJournal = async (id) => {
  const { data } = await api.delete(`/${id}`);
  return data;
};