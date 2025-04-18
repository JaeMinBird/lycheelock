import { writable } from 'svelte/store';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  totp_enabled: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isTotpVerified: boolean;
  masterKey: CryptoKey | null;
  salt: Uint8Array | null;
}

// Create the auth store with initial values
const createAuthStore = () => {
  const initialState: AuthStore = {
    user: null,
    isAuthenticated: false,
    isTotpVerified: false,
    masterKey: null,
    salt: null
  };

  const { subscribe, set, update } = writable<AuthStore>(initialState);

  return {
    subscribe,
    setUser: (user: User | null) => update(state => ({ ...state, user })),
    setAuthenticated: (isAuthenticated: boolean) => update(state => ({ ...state, isAuthenticated })),
    setTotpVerified: (isTotpVerified: boolean) => update(state => ({ ...state, isTotpVerified })),
    setMasterKey: (masterKey: CryptoKey | null) => update(state => ({ ...state, masterKey })),
    setSalt: (salt: Uint8Array | null) => update(state => ({ ...state, salt })),
    logout: () => set(initialState)
  };
};

export const authStore = createAuthStore(); 