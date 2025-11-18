import { openDB } from 'idb';

const DB_NAME = 'tailorShopDB';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Create object stores for each entity
    if (!db.objectStoreNames.contains('customers')) {
      db.createObjectStore('customers', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('orders')) {
      db.createObjectStore('orders', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('employees')) {
      db.createObjectStore('employees', { keyPath: '_id' });
    }
    if (!db.objectStoreNames.contains('suitTypes')) {
      db.createObjectStore('suitTypes', { keyPath: '_id' });
    }
    // Queue for offline operations
    if (!db.objectStoreNames.contains('syncQueue')) {
      const queueStore = db.createObjectStore('syncQueue', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      queueStore.createIndex('timestamp', 'timestamp');
    }
  },
});

export const db = {
  // Generic CRUD operations
  async get(store, key) {
    const database = await dbPromise;
    return database.get(store, key);
  },

  async getAll(store) {
    const database = await dbPromise;
    return database.getAll(store);
  },

  async set(store, value) {
    const database = await dbPromise;
    return database.put(store, value);
  },

  async setAll(store, values) {
    const database = await dbPromise;
    const tx = database.transaction(store, 'readwrite');
    await Promise.all(values.map(value => tx.store.put(value)));
    return tx.done;
  },

  async delete(store, key) {
    const database = await dbPromise;
    return database.delete(store, key);
  },

  async clear(store) {
    const database = await dbPromise;
    return database.clear(store);
  },

  // Sync queue operations
  async addToQueue(operation) {
    const database = await dbPromise;
    return database.add('syncQueue', {
      ...operation,
      timestamp: Date.now(),
      retries: 0,
    });
  },

  async getQueue() {
    const database = await dbPromise;
    return database.getAll('syncQueue');
  },

  async removeFromQueue(id) {
    const database = await dbPromise;
    return database.delete('syncQueue', id);
  },

  async clearQueue() {
    const database = await dbPromise;
    return database.clear('syncQueue');
  },
};

