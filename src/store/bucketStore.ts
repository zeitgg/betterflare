import { create } from 'zustand';

interface BucketState {
  currentBucket: string | null;
  currentPrefix: string;
  setCurrentBucket: (bucket: string | null) => void;
  setCurrentPrefix: (prefix: string) => void;
  navigateToFolder: (prefix: string) => void;
  navigateUp: () => void;
}

export const useBucketStore = create<BucketState>()((set, get) => ({
  currentBucket: null,
  currentPrefix: '',
  
  setCurrentBucket: (bucket) => set({ 
    currentBucket: bucket,
    currentPrefix: '' 
  }),
  
  setCurrentPrefix: (prefix) => set({ 
    currentPrefix: prefix 
  }),
  
  navigateToFolder: (prefix) => set({ 
    currentPrefix: prefix 
  }),
  
  navigateUp: () => {
    const currentPrefix = get().currentPrefix;
    
    // If we're at the root level already
    if (!currentPrefix || currentPrefix === '') {
      return;
    }
    
    // Remove the last folder from the path
    const parts = currentPrefix.split('/');
    parts.pop(); // Remove the last empty string if the prefix ends with '/'
    if (parts[parts.length - 1] === '') {
      parts.pop();
    }
    
    const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
    set({ currentPrefix: newPrefix });
  }
}));
