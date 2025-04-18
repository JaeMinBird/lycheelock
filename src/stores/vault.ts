import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { authStore } from './auth';
import { encryptData, decryptData, arrayBufferToBase64, base64ToArrayBuffer } from '$lib/crypto';

// Types
export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultStore {
  entries: PasswordEntry[];
  isLoading: boolean;
  error: string | null;
}

// Create the vault store with initial values
const createVaultStore = () => {
  const initialState: VaultStore = {
    entries: [],
    isLoading: false,
    error: null
  };

  const { subscribe, set, update } = writable<VaultStore>(initialState);

  return {
    subscribe,
    
    // Load the vault data from Supabase
    loadVault: async () => {
      let unsubscribe: () => void;
      
      const load = async () => {
        // Get the current auth state
        let authState: { masterKey: CryptoKey | null; user: { id: string } | null } = { masterKey: null, user: null };
        
        unsubscribe = authStore.subscribe(state => {
          authState = { masterKey: state.masterKey, user: state.user };
        });
        
        if (!authState.masterKey || !authState.user) {
          update(state => ({ ...state, error: 'Not authenticated' }));
          unsubscribe();
          return;
        }
        
        // Start loading
        update(state => ({ ...state, isLoading: true, error: null }));
        
        try {
          // Fetch the encrypted vault data from Supabase
          const { data, error } = await supabase
            .from('vaults')
            .select('*')
            .eq('user_id', authState.user.id)
            .single();
            
          if (error) throw error;
          
          if (!data || !data.encrypted_data || !data.iv) {
            // No vault data yet, initialize with empty array
            update(state => ({ ...state, entries: [], isLoading: false }));
            unsubscribe();
            return;
          }
          
          // Decrypt the vault data
          const encryptedData = base64ToArrayBuffer(data.encrypted_data);
          const ivData = base64ToArrayBuffer(data.iv);
          const iv = new Uint8Array(ivData.byteLength);
          iv.set(new Uint8Array(ivData));
          
          const decryptedData = await decryptData<PasswordEntry[]>(encryptedData, iv, authState.masterKey);
          
          // Update the store
          update(state => ({ ...state, entries: decryptedData, isLoading: false }));
        } catch (err) {
          console.error('Error loading vault:', err);
          update(state => ({ ...state, error: 'Failed to load vault data', isLoading: false }));
        }
        
        unsubscribe();
      };
      
      load();
    },
    
    // Save the vault data to Supabase
    saveVault: async () => {
      let unsubscribe: () => void;
      
      const save = async () => {
        // Get the current auth and vault state
        let authState: { masterKey: CryptoKey | null; user: { id: string } | null } = { masterKey: null, user: null };
        let entries: PasswordEntry[] = [];
        
        unsubscribe = authStore.subscribe(state => {
          authState = { masterKey: state.masterKey, user: state.user };
        });
        
        // Get the current entries
        const vaultUnsubscribe = subscribe(state => {
          entries = state.entries;
        });
        
        if (!authState.masterKey || !authState.user) {
          update(state => ({ ...state, error: 'Not authenticated' }));
          unsubscribe();
          vaultUnsubscribe();
          return;
        }
        
        // Start loading
        update(state => ({ ...state, isLoading: true, error: null }));
        
        try {
          // Encrypt the vault data
          const { encrypted, iv } = await encryptData(entries, authState.masterKey);
          
          // Convert to base64 for storage
          const encryptedBase64 = arrayBufferToBase64(encrypted);
          const ivBase64 = arrayBufferToBase64(iv.buffer);
          
          // Save to Supabase using upsert
          const { error } = await supabase
            .from('vaults')
            .upsert({
              user_id: authState.user.id,
              encrypted_data: encryptedBase64,
              iv: ivBase64,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            
          if (error) throw error;
          
          // Update the store
          update(state => ({ ...state, isLoading: false }));
        } catch (err) {
          console.error('Error saving vault:', err);
          update(state => ({ ...state, error: 'Failed to save vault data', isLoading: false }));
        }
        
        unsubscribe();
        vaultUnsubscribe();
      };
      
      save();
    },
    
    // Add a new password entry
    addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newEntry: PasswordEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      
      update(state => ({
        ...state,
        entries: [...state.entries, newEntry]
      }));
    },
    
    // Update an existing password entry
    updateEntry: (id: string, updates: Partial<Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
      update(state => ({
        ...state,
        entries: state.entries.map(entry => 
          entry.id === id
            ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
            : entry
        )
      }));
    },
    
    // Delete a password entry
    deleteEntry: (id: string) => {
      update(state => ({
        ...state,
        entries: state.entries.filter(entry => entry.id !== id)
      }));
    },
    
    // Reset the store
    reset: () => set(initialState)
  };
};

export const vaultStore = createVaultStore(); 