import axios from 'axios';

const { VITE_API_HOST, VITE_API_PORT } = import.meta.env;

const port = VITE_API_PORT ? `:${VITE_API_PORT}` : '';
const host = VITE_API_HOST || 'http://localhost';

const baseURL = `${host}${port}/`;

const defaultOptions = { baseURL };

const mainAxios = axios.create(defaultOptions);

export default mainAxios;