import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { R2Credentials } from '@/server/services/r2Service';

interface CredentialsState {
  credentials: R2Credentials | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  setCredentials: (credentials: R2Credentials) => void;
  clearCredentials: () => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      credentials: null,
      isHydrated: false,
      isAuthenticated: false,
      setCredentials: (credentials) => set({ credentials, isAuthenticated: true }),
      clearCredentials: () => set({ credentials: null, isAuthenticated: false }),
    }),
    {
      name: 'r2-credentials',
      storage: createJSONStorage(() => {
        // Check if window is defined (client-side)
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a mock storage for SSR
        return {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        };
      }),
      // Only store the credentials and isAuthenticated fields
      partialize: (state) => ({
        credentials: state.credentials,
        isAuthenticated: state.isAuthenticated,
      }),
      // Add onRehydrateStorage to track when the store is hydrated
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
