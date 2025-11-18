import axios from 'axios';
import { db } from './db';
import { API_ENDPOINTS } from '../config/api';

class DataInitializer {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return true;
    }

    this.initializationPromise = this._performInitialization();
    const result = await this.initializationPromise;
    this.initializationPromise = null;
    return result;
  }

  async _performInitialization() {
    console.log('🚀 Initializing app data...');

    try {
      // Check if we have cached data
      const hasCache = await this.hasCachedData();

      if (navigator.onLine) {
        // Online: Try to fetch from server
        console.log('📡 Online - Fetching fresh data from server...');
        const success = await this.fetchAllDataFromServer();
        
        if (success) {
          console.log('✅ Fresh data loaded from server');
          this.isInitialized = true;
          return true;
        } else if (hasCache) {
          console.log('⚠️ Server unreachable, using cached data');
          this.isInitialized = true;
          return true;
        } else {
          console.log('❌ No server connection and no cached data');
          this.isInitialized = false;
          return false;
        }
      } else {
        // Offline: Use cached data
        if (hasCache) {
          console.log('💾 Offline - Using cached data');
          this.isInitialized = true;
          return true;
        } else {
          console.log('❌ Offline and no cached data available');
          this.isInitialized = false;
          return false;
        }
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      
      // Check if we have cache as fallback
      const hasCache = await this.hasCachedData();
      if (hasCache) {
        console.log('⚠️ Error occurred, but cached data is available');
        this.isInitialized = true;
        return true;
      }
      
      this.isInitialized = false;
      return false;
    }
  }

  async hasCachedData() {
    try {
      const [customers, orders, employees, suitTypes] = await Promise.all([
        db.getAll('customers'),
        db.getAll('orders'),
        db.getAll('employees'),
        db.getAll('suitTypes')
      ]);

      // Consider data cached if at least one store has data
      const hasData = customers.length > 0 || 
                     orders.length > 0 || 
                     employees.length > 0 || 
                     suitTypes.length > 0;

      console.log(`💾 Cache status: ${hasData ? 'Available' : 'Empty'}`);
      console.log(`   - Customers: ${customers.length}`);
      console.log(`   - Orders: ${orders.length}`);
      console.log(`   - Employees: ${employees.length}`);
      console.log(`   - Suit Types: ${suitTypes.length}`);

      return hasData;
    } catch (error) {
      console.error('Error checking cached data:', error);
      return false;
    }
  }

  async fetchAllDataFromServer() {
    try {
      // Set timeout for server requests
      const timeout = 10000; // 10 seconds

      const fetchWithTimeout = (url) => {
        return Promise.race([
          axios.get(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [customers, orders, employees, suitTypes] = await Promise.all([
        fetchWithTimeout(API_ENDPOINTS.CUSTOMERS).catch(err => {
          console.warn('Failed to fetch customers:', err.message);
          return null;
        }),
        fetchWithTimeout(API_ENDPOINTS.ORDERS).catch(err => {
          console.warn('Failed to fetch orders:', err.message);
          return null;
        }),
        fetchWithTimeout(API_ENDPOINTS.EMPLOYEES).catch(err => {
          console.warn('Failed to fetch employees:', err.message);
          return null;
        }),
        fetchWithTimeout(API_ENDPOINTS.SUIT_TYPES).catch(err => {
          console.warn('Failed to fetch suit types:', err.message);
          return null;
        })
      ]);

      // Check if at least one request succeeded
      const hasData = customers || orders || employees || suitTypes;

      if (!hasData) {
        return false;
      }

      // Store fetched data in IndexedDB
      if (customers?.data) {
        await db.setAll('customers', customers.data);
        console.log(`✅ Cached ${customers.data.length} customers`);
      }
      if (orders?.data) {
        await db.setAll('orders', orders.data);
        console.log(`✅ Cached ${orders.data.length} orders`);
      }
      if (employees?.data) {
        await db.setAll('employees', employees.data);
        console.log(`✅ Cached ${employees.data.length} employees`);
      }
      if (suitTypes?.data) {
        await db.setAll('suitTypes', suitTypes.data);
        console.log(`✅ Cached ${suitTypes.data.length} suit types`);
      }

      return true;
    } catch (error) {
      console.error('Error fetching data from server:', error);
      return false;
    }
  }

  async clearCache() {
    try {
      await Promise.all([
        db.clear('customers'),
        db.clear('orders'),
        db.clear('employees'),
        db.clear('suitTypes'),
        db.clear('syncQueue')
      ]);
      console.log('🗑️ Cache cleared');
      this.isInitialized = false;
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  async getCacheStats() {
    try {
      const [customers, orders, employees, suitTypes, queue] = await Promise.all([
        db.getAll('customers'),
        db.getAll('orders'),
        db.getAll('employees'),
        db.getAll('suitTypes'),
        db.getQueue()
      ]);

      return {
        customers: customers.length,
        orders: orders.length,
        employees: employees.length,
        suitTypes: suitTypes.length,
        pendingSync: queue.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

// Create singleton instance
export const dataInitializer = new DataInitializer();

