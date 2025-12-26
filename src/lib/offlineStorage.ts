import { BusinessIdea } from "@/types/ideas";

const DB_NAME = "fasttrack-offline";
const DB_VERSION = 1;

interface PendingMessage {
  id: string;
  sessionId: string;
  content: string;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Ideas store - keyed by session ID
      if (!db.objectStoreNames.contains("ideas")) {
        db.createObjectStore("ideas", { keyPath: "sessionId" });
      }
      
      // Pending messages store
      if (!db.objectStoreNames.contains("pendingMessages")) {
        const msgStore = db.createObjectStore("pendingMessages", { keyPath: "id" });
        msgStore.createIndex("sessionId", "sessionId", { unique: false });
      }
      
      // Documents metadata store
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }
    };
  });
};

// Ideas caching
export const saveIdeasToCache = async (sessionId: string, ideas: BusinessIdea[]): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction("ideas", "readwrite");
    const store = tx.objectStore("ideas");
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ sessionId, ideas, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to cache ideas:", error);
  }
};

export const getIdeasFromCache = async (sessionId: string): Promise<BusinessIdea[] | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction("ideas", "readonly");
    const store = tx.objectStore("ideas");
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.ideas || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get cached ideas:", error);
    return null;
  }
};

export const getAllCachedIdeas = async (): Promise<BusinessIdea[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction("ideas", "readonly");
    const store = tx.objectStore("ideas");
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        const allIdeas = results.flatMap(r => r.ideas || []);
        resolve(allIdeas);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get all cached ideas:", error);
    return [];
  }
};

// Pending messages for offline queue
export const savePendingMessage = async (sessionId: string, content: string): Promise<string> => {
  const id = crypto.randomUUID();
  try {
    const db = await openDB();
    const tx = db.transaction("pendingMessages", "readwrite");
    const store = tx.objectStore("pendingMessages");
    
    const message: PendingMessage = {
      id,
      sessionId,
      content,
      timestamp: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    return id;
  } catch (error) {
    console.error("Failed to save pending message:", error);
    throw error;
  }
};

export const getPendingMessages = async (): Promise<PendingMessage[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction("pendingMessages", "readonly");
    const store = tx.objectStore("pendingMessages");
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get pending messages:", error);
    return [];
  }
};

export const deletePendingMessage = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction("pendingMessages", "readwrite");
    const store = tx.objectStore("pendingMessages");
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete pending message:", error);
  }
};

export const clearPendingMessages = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction("pendingMessages", "readwrite");
    const store = tx.objectStore("pendingMessages");
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to clear pending messages:", error);
  }
};

// Clear all cached data
export const clearAllCachedData = async (): Promise<void> => {
  try {
    const db = await openDB();
    const stores = ["ideas", "pendingMessages", "documents"];
    
    for (const storeName of stores) {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error("Failed to clear all cached data:", error);
    throw error;
  }
};
