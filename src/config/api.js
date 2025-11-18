// API Configuration
// Production URL
const PRODUCTION_API_URL = 'https://server-tailor-shop.onrender.com';

// Local development URL (commented out - uncomment for local development)
// const LOCAL_API_URL = 'http://localhost:5000';

const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Use production URL by default
  // return PRODUCTION_API_URL;
  
  // For local development, uncomment the line below and comment the line above
  // return LOCAL_API_URL;
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  EMPLOYEES: `${API_BASE_URL}/api/employees`,
  SUIT_TYPES: `${API_BASE_URL}/api/suit-types`,
};

export default API_BASE_URL;

