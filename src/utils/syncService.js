import axios from 'axios';
import { db } from './db';
import { API_ENDPOINTS } from '../config/api';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  // Initialize listeners
  init() {
    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored, starting sync...');
      this.sync();
    });

    // Periodic sync check (every 30 seconds when online)
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, 30000);

    // Initial sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  // Register callback for sync completion
  onSyncComplete(callback) {
    this.syncCallbacks.push(callback);
  }

  // Notify all callbacks
  notifySyncComplete() {
    this.syncCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in sync callback:', error);
      }
    });
  }

  async sync() {
    if (!navigator.onLine || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    
    try {
      const queue = await db.getQueue();

      if (queue.length > 0) {
        console.log(`🔄 Syncing ${queue.length} queued operations...`);

        for (const item of queue) {
          try {
            let response;
            const store = this.getStoreFromUrl(item.url);

            switch (item.type) {
              case 'POST':
                response = await axios.post(item.url, item.data);
                // Replace temp ID with real ID
                if (store && response.data) {
                  await db.delete(store, item.tempId);
                  await db.set(store, response.data);
                }
                break;

              case 'PUT':
                response = await axios.put(item.url, item.data);
                if (store && response.data) {
                  await db.set(store, response.data);
                }
                break;

              case 'DELETE':
                response = await axios.delete(item.url);
                if (store) {
                  await db.delete(store, item.id);
                }
                break;
            }

            // Remove from queue on success
            await db.removeFromQueue(item.id);
            console.log(`✅ Synced ${item.type} ${item.url}`);
          } catch (error) {
            console.error(`❌ Failed to sync ${item.type} ${item.url}:`, error);
            // Increment retry count
            item.retries = (item.retries || 0) + 1;
            
            // Remove if too many retries (optional)
            if (item.retries > 5) {
              await db.removeFromQueue(item.id);
              console.warn(`⚠️ Removed failed sync item after ${item.retries} retries`);
            }
          }
        }
      }

      // Sync all data from server to ensure consistency
      await this.syncAllData();
      
      // Notify callbacks
      this.notifySyncComplete();
      
      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncAllData() {
    try {
      // Set timeout for sync requests
      const timeout = 10000; // 10 seconds

      const fetchWithTimeout = (url) => {
        return Promise.race([
          axios.get(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sync timeout')), timeout)
          )
        ]);
      };

      // Sync all entities
      const [customers, orders, employees, suitTypes] = await Promise.all([
        fetchWithTimeout(API_ENDPOINTS.CUSTOMERS).catch(() => null),
        fetchWithTimeout(API_ENDPOINTS.ORDERS).catch(() => null),
        fetchWithTimeout(API_ENDPOINTS.EMPLOYEES).catch(() => null),
        fetchWithTimeout(API_ENDPOINTS.SUIT_TYPES).catch(() => null),
      ]);

      let syncedCount = 0;
      if (customers?.data) {
        await db.setAll('customers', customers.data);
        syncedCount++;
      }
      if (orders?.data) {
        await db.setAll('orders', orders.data);
        syncedCount++;
      }
      if (employees?.data) {
        await db.setAll('employees', employees.data);
        syncedCount++;
      }
      if (suitTypes?.data) {
        await db.setAll('suitTypes', suitTypes.data);
        syncedCount++;
      }

      if (syncedCount > 0) {
        console.log(`📦 Synced ${syncedCount} data types from server`);
      } else {
        console.warn('⚠️ No data synced from server');
      }
    } catch (error) {
      console.error('Error syncing all data:', error);
    }
  }

  getStoreFromUrl(url) {
    if (url.includes('/customers')) return 'customers';
    if (url.includes('/orders')) return 'orders';
    if (url.includes('/employees')) return 'employees';
    if (url.includes('/suit-types')) return 'suitTypes';
    return null;
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Create singleton instance
export const syncService = new SyncService();

