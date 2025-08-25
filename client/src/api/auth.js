import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const signup = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/signup`, userData);
    return response.data;
};

export const login = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/login`, userData);
    return response.data;
};