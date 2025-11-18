// API Configuration
// Comment/uncomment the line below to switch between production and local development
const API_BASE_URL = 'https://server-tailor-shop.onrender.com';
// const API_BASE_URL = 'http://localhost:5000';

export const API_ENDPOINTS = {
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  EMPLOYEES: `${API_BASE_URL}/api/employees`,
  SUIT_TYPES: `${API_BASE_URL}/api/suit-types`,
};

// Export offline API wrapper
export { offlineApi as api } from '../utils/offlineApi';

export default API_BASE_URL;

