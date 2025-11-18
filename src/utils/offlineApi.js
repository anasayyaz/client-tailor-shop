import axios from 'axios';
import { db } from './db';

// Check if online
const isOnline = () => navigator.onLine;

// Generate temporary ID for offline items
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Map endpoints to store names
const getStoreFromUrl = (url) => {
  if (url.includes('/customers')) return 'customers';
  if (url.includes('/orders')) return 'orders';
  if (url.includes('/employees')) return 'employees';
  if (url.includes('/suit-types')) return 'suitTypes';
  return null;
};

// Extract base endpoint from full URL
const getBaseEndpoint = (url) => {
  const match = url.match(/\/api\/(customers|orders|employees|suit-types)/);
  return match ? match[0] : null;
};

export const offlineApi = {
  // GET - Try online first, fallback to IndexedDB
  async get(url) {
    if (isOnline()) {
      try {
        const response = await axios.get(url);
        const store = getStoreFromUrl(url);
        if (store && response.data) {
          // Cache the response
          if (Array.isArray(response.data)) {
            await db.setAll(store, response.data);
          } else {
            await db.set(store, response.data);
          }
        }
        return response;
      } catch (error) {
        // If online but request fails, try offline
        console.warn('Online request failed, trying offline:', error);
      }
    }

    // Offline: get from IndexedDB
    const store = getStoreFromUrl(url);
    if (store) {
      // Check if it's a specific item request (has ID at the end)
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // If last part doesn't contain query params and looks like an ID
      if (!lastPart.includes('?') && lastPart !== store && lastPart.length > 0) {
        const data = await db.get(store, lastPart);
        return { data, fromCache: true };
      } else {
        // Get all items and filter out deleted ones
        const allData = await db.getAll(store);
        const data = allData.filter(item => !item._deleted);
        return { data, fromCache: true };
      }
    }
    throw new Error('Endpoint not supported for offline');
  },

  // POST - Queue if offline, execute if online
  async post(url, data) {
    const store = getStoreFromUrl(url);
    const tempId = generateTempId();
    const item = { ...data, _id: tempId, _isOffline: true, _createdAt: Date.now() };

    if (isOnline()) {
      try {
        const response = await axios.post(url, data);
        // Update local cache
        if (store && response.data) {
          await db.set(store, response.data);
        }
        return response;
      } catch (error) {
        // If online but request fails, queue it
        await db.addToQueue({ type: 'POST', url, data, tempId });
        // Still save locally for immediate UI update
        if (store) {
          await db.set(store, item);
        }
        console.error('POST request failed, queued for sync:', error);
        // Return the item so UI can update
        return { data: item, fromCache: true, queued: true };
      }
    } else {
      // Offline: queue and save locally
      await db.addToQueue({ type: 'POST', url, data, tempId });
      if (store) {
        await db.set(store, item);
      }
      console.log('Offline: POST operation queued');
      return { data: item, fromCache: true, queued: true };
    }
  },

  // PUT - Queue if offline, execute if online
  async put(url, data) {
    const store = getStoreFromUrl(url);
    const id = data._id || url.split('/').pop();

    if (isOnline()) {
      try {
        const response = await axios.put(url, data);
        // Update local cache
        if (store && response.data) {
          await db.set(store, response.data);
        }
        return response;
      } catch (error) {
        // If online but request fails, queue it
        await db.addToQueue({ type: 'PUT', url, data, id });
        // Still update locally
        if (store) {
          await db.set(store, { ...data, _isOffline: true, _updatedAt: Date.now() });
        }
        console.error('PUT request failed, queued for sync:', error);
        return { data: { ...data, _isOffline: true }, fromCache: true, queued: true };
      }
    } else {
      // Offline: queue and update locally
      await db.addToQueue({ type: 'PUT', url, data, id });
      if (store) {
        await db.set(store, { ...data, _isOffline: true, _updatedAt: Date.now() });
      }
      console.log('Offline: PUT operation queued');
      return { data: { ...data, _isOffline: true }, fromCache: true, queued: true };
    }
  },

  // DELETE - Queue if offline, execute if online
  async delete(url) {
    const store = getStoreFromUrl(url);
    const id = url.split('/').pop();

    if (isOnline()) {
      try {
        const response = await axios.delete(url);
        // Remove from local cache
        if (store) {
          await db.delete(store, id);
        }
        return response;
      } catch (error) {
        // If online but request fails, queue it
        await db.addToQueue({ type: 'DELETE', url, id });
        // Still remove locally (soft delete)
        if (store) {
          const item = await db.get(store, id);
          if (item) {
            await db.set(store, { ...item, _deleted: true, _isOffline: true });
          }
        }
        console.error('DELETE request failed, queued for sync:', error);
        return { data: { success: true }, fromCache: true, queued: true };
      }
    } else {
      // Offline: queue and mark as deleted locally
      await db.addToQueue({ type: 'DELETE', url, id });
      if (store) {
        const item = await db.get(store, id);
        if (item) {
          await db.set(store, { ...item, _deleted: true, _isOffline: true });
        }
      }
      console.log('Offline: DELETE operation queued');
      return { data: { success: true }, fromCache: true, queued: true };
    }
  },
};

