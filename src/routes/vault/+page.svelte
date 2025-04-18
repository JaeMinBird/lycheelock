<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '../../stores/auth';
  import { vaultStore, type PasswordEntry } from '../../stores/vault';
  import PasswordCard from '../../components/PasswordCard.svelte';
  import PasswordForm from '../../components/PasswordForm.svelte';
  
  let searchQuery = '';
  let selectedCategory = '';
  let showAddForm = false;
  let editingEntry: PasswordEntry | null = null;
  let viewingEntry: PasswordEntry | null = null;
  let isLoading = true;
  let unsubscribe: () => void;
  let categories: string[] = [];
  
  onMount(async () => {
    // Check if user is authenticated
    let isAuthenticated = false;
    let isTotpVerified = false;
    
    const unsub = authStore.subscribe(state => {
      isAuthenticated = state.isAuthenticated;
      isTotpVerified = state.isTotpVerified;
    });
    unsub(); // Call to unsubscribe immediately
    
    if (!isAuthenticated || !isTotpVerified) {
      goto('/');
      return;
    }
    
    // Load vault data
    await vaultStore.loadVault();
    
    // Subscribe to vault store
    unsubscribe = vaultStore.subscribe(state => {
      isLoading = state.isLoading;
      
      // Extract all unique categories
      const uniqueCategories = new Set<string>();
      state.entries.forEach(entry => {
        if (entry.category) {
          uniqueCategories.add(entry.category);
        }
      });
      categories = Array.from(uniqueCategories).sort();
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });
  
  // Filter entries based on search query and category
  $: filteredEntries = $vaultStore.entries.filter(entry => {
    const matchesSearch = searchQuery ? 
      (entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
       entry.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()))) : 
      true;
    
    const matchesCategory = selectedCategory ? 
      entry.category === selectedCategory : 
      true;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort entries by name
  $: sortedEntries = [...filteredEntries].sort((a, b) => a.name.localeCompare(b.name));
  
  function handleAddEntry() {
    showAddForm = true;
    editingEntry = null;
  }
  
  function handleEditEntry(event: CustomEvent<PasswordEntry>) {
    editingEntry = event.detail;
    showAddForm = true;
  }
  
  function handleDeleteEntry(event: CustomEvent<PasswordEntry>) {
    if (confirm(`Are you sure you want to delete ${event.detail.name}?`)) {
      vaultStore.deleteEntry(event.detail.id);
      vaultStore.saveVault();
    }
  }
  
  function handleViewEntry(event: CustomEvent<PasswordEntry>) {
    viewingEntry = event.detail;
  }
  
  function handleSaveEntry(event: CustomEvent<Partial<PasswordEntry>>) {
    if (editingEntry) {
      // Update existing entry
      vaultStore.updateEntry(editingEntry.id, event.detail);
    } else {
      // Add new entry
      vaultStore.addEntry(event.detail as Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>);
    }
    
    vaultStore.saveVault();
    showAddForm = false;
    editingEntry = null;
  }
  
  function handleCancel() {
    showAddForm = false;
    editingEntry = null;
    viewingEntry = null;
  }
  
  function handleLogout() {
    authStore.logout();
    vaultStore.reset();
    goto('/');
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Lychee Lock</h1>
      
      <div class="flex items-center space-x-4">
        <button
          on:click={handleLogout}
          class="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
  
  <!-- Main content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if showAddForm}
      <div class="mb-6">
        <button
          on:click={handleCancel}
          class="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back to vault
        </button>
        
        <PasswordForm 
          isEditing={!!editingEntry} 
          entry={editingEntry || {}} 
          on:save={handleSaveEntry} 
          on:cancel={handleCancel} 
        />
      </div>
    {:else if viewingEntry}
      <div class="mb-6">
        <button
          on:click={handleCancel}
          class="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back to vault
        </button>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-lg mx-auto">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            {viewingEntry.name}
          </h2>
          
          {#if viewingEntry.url}
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</h3>
              <p class="text-gray-800 dark:text-gray-200">
                <a 
                  href={viewingEntry.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {viewingEntry.url}
                </a>
              </p>
            </div>
          {/if}
          
          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</h3>
            <div class="flex items-center">
              <p class="text-gray-800 dark:text-gray-200 mr-2">{viewingEntry.username}</p>
              <button
                on:click={() => navigator.clipboard.writeText(viewingEntry.username)}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                title="Copy username"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</h3>
            <div class="flex items-center">
              <p class="text-gray-800 dark:text-gray-200 mr-2">{viewingEntry.password}</p>
              <button
                on:click={() => navigator.clipboard.writeText(viewingEntry.password)}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                title="Copy password"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          
          {#if viewingEntry.category}
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</h3>
              <p class="text-gray-800 dark:text-gray-200">
                <span class="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                  {viewingEntry.category}
                </span>
              </p>
            </div>
          {/if}
          
          {#if viewingEntry.notes}
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</h3>
              <p class="text-gray-800 dark:text-gray-200 whitespace-pre-line">{viewingEntry.notes}</p>
            </div>
          {/if}
          
          <div class="flex justify-end space-x-3 mt-6">
            <button
              on:click={handleCancel}
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
            <button
              on:click={() => { editingEntry = viewingEntry; viewingEntry = null; showAddForm = true; }}
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    {:else}
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your Password Vault</h2>
        <button
          on:click={handleAddEntry}
          class="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Entry
        </button>
      </div>
      
      <!-- Filters -->
      <div class="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div class="relative flex-1">
          <input
            type="text"
            bind:value={searchQuery}
            class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Search by name, username, or URL..."
          />
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="flex-shrink-0 w-full md:w-64">
          <select
            bind:value={selectedCategory}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <!-- Entries list -->
      {#if sortedEntries.length === 0}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          {#if searchQuery || selectedCategory}
            <p class="text-gray-600 dark:text-gray-400">No entries found with the current filters.</p>
          {:else}
            <p class="text-gray-600 dark:text-gray-400 mb-4">Your password vault is empty.</p>
            <button
              on:click={handleAddEntry}
              class="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Your First Password
            </button>
          {/if}
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each sortedEntries as entry (entry.id)}
            <PasswordCard
              {entry}
              on:edit={handleEditEntry}
              on:delete={handleDeleteEntry}
              on:view={handleViewEntry}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </main>
</div> 