window.PortfolioStorage = (() => {
  const DB_NAME = "portfolioSphereDb";
  const STORE_NAME = "keyval";
  const DB_VERSION = 1;

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB is not available"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    });
  }

  async function transaction(mode, callback) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = callback(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error("IndexedDB transaction failed"));
      };
    });
  }

  return {
    get(key) {
      return transaction("readonly", (store) => store.get(key));
    },
    set(key, value) {
      return transaction("readwrite", (store) => store.put(value, key));
    },
    remove(key) {
      return transaction("readwrite", (store) => store.delete(key));
    }
  };
})();

