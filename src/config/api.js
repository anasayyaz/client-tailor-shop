// API Configuration
// In production (combined deployment), use relative URLs
// In development or separate deployment, use full URL from env
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If no env var and in production, use relative URL (same domain)
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  EMPLOYEES: `${API_BASE_URL}/api/employees`,
  SUIT_TYPES: `${API_BASE_URL}/api/suit-types`,
};

export default API_BASE_URL;

