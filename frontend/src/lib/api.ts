import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (userData: any) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },
  getSpotifyAuthUrl: async () => {
    const response = await api.get('/api/auth/spotify');
    return response.data.auth_url;
  },
};

export const stationAPI = {
  createStation: async (stationData: any) => {
    const response = await api.post('/api/stations', stationData);
    return response.data;
  },
  getAllStations: async () => {
    const response = await api.get('/api/stations');
    return response.data;
  },
  getStation: async (id: string) => {
    const response = await api.get(`/api/stations/${id}`);
    return response.data;
  },
  getDJStations: async (djId: string) => {
    const response = await api.get(`/api/stations/dj/${djId}`);
    return response.data;
  },
  startLiveSession: async (stationId: string) => {
    const response = await api.post(`/api/stations/${stationId}/go-live`);
    return response.data;
  },
  endLiveSession: async (stationId: string) => {
    const response = await api.post(`/api/stations/${stationId}/end-live`);
    return response.data;
  },
};

export const spotifyAPI = {
  searchTracks: async (query: string, limit: number = 10) => {
    const response = await api.get(`/api/spotify/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },
  getRecommendations: async (seedTracks: string[], limit: number = 10) => {
    const seedTracksParam = seedTracks.join(',');
    const response = await api.get(`/api/spotify/recommendations?seed_tracks=${seedTracksParam}&limit=${limit}`);
    return response.data;
  },
};

export const liveAPI = {
  getLiveSessions: async () => {
    const response = await api.get('/api/live-sessions');
    return response.data;
  },
};

export default api;
