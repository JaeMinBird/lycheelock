<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PasswordEntry } from '../stores/vault';
  
  export let isEditing = false;
  export let entry: Partial<PasswordEntry> = {
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: ''
  };
  
  const dispatch = createEventDispatcher<{
    save: Partial<PasswordEntry>;
    cancel: void;
  }>();
  
  let showPassword = false;
  
  function toggleShowPassword() {
    showPassword = !showPassword;
  }
  
  function handleSubmit() {
    // Validate form (simple validation)
    if (!entry.name || !entry.username || !entry.password) {
      return;
    }
    
    dispatch('save', entry);
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
  
  function generateRandomPassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=-';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    entry.password = password;
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-lg mx-auto">
  <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
    {isEditing ? 'Edit' : 'Add'} Password
  </h2>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Name -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
      <input
        type="text"
        id="name"
        bind:value={entry.name}
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Website or app name"
      />
    </div>
    
    <!-- URL -->
    <div>
      <label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
      <input
        type="url"
        id="url"
        bind:value={entry.url}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="https://example.com"
      />
    </div>
    
    <!-- Username -->
    <div>
      <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
      <input
        type="text"
        id="username"
        bind:value={entry.username}
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Email or username"
      />
    </div>
    
    <!-- Password -->
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
      <div class="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          bind:value={entry.password}
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-24"
          placeholder="Password"
        />
        <div class="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          <button
            type="button"
            on:click={toggleShowPassword}
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
            title={showPassword ? "Hide password" : "Show password"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              {#if showPassword}
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              {:else}
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              {/if}
            </svg>
          </button>
          <button
            type="button"
            on:click={generateRandomPassword}
            class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 border border-blue-500 dark:border-blue-400 rounded"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
    
    <!-- Category -->
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
      <input
        type="text"
        id="category"
        bind:value={entry.category}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Category (optional)"
      />
    </div>
    
    <!-- Notes -->
    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
      <textarea
        id="notes"
        bind:value={entry.notes}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Additional notes (optional)"
      ></textarea>
    </div>
    
    <!-- Buttons -->
    <div class="flex justify-end space-x-3 pt-2">
      <button
        type="button"
        on:click={handleCancel}
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isEditing ? 'Update' : 'Save'}
      </button>
    </div>
  </form>
</div> 