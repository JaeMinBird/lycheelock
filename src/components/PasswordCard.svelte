<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PasswordEntry } from '../stores/vault';
  
  export let entry: PasswordEntry;
  
  const dispatch = createEventDispatcher<{
    edit: PasswordEntry;
    delete: PasswordEntry;
    view: PasswordEntry;
  }>();
  
  let isPasswordVisible = false;
  
  function togglePasswordVisibility() {
    isPasswordVisible = !isPasswordVisible;
  }
  
  function handleEditClick() {
    dispatch('edit', entry);
  }
  
  function handleDeleteClick() {
    dispatch('delete', entry);
  }
  
  function handleViewClick() {
    dispatch('view', entry);
  }
  
  // Function to copy password to clipboard
  function copyPassword() {
    navigator.clipboard.writeText(entry.password);
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700">
  <div class="flex justify-between items-start mb-2">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{entry.name}</h3>
    <div class="flex space-x-2">
      <button
        on:click={handleViewClick}
        class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        title="View details"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        on:click={handleEditClick}
        class="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
        title="Edit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
      <button
        on:click={handleDeleteClick}
        class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        title="Delete"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>

  {#if entry.url}
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
      <a href={entry.url} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
        {entry.url}
      </a>
    </p>
  {/if}

  <div class="mb-2">
    <p class="text-sm text-gray-700 dark:text-gray-300">
      <span class="font-medium">Username:</span> {entry.username}
    </p>
  </div>

  <div class="mb-2 flex items-center">
    <p class="text-sm text-gray-700 dark:text-gray-300 mr-2">
      <span class="font-medium">Password:</span> 
      {#if isPasswordVisible}
        {entry.password}
      {:else}
        •••••••••••
      {/if}
    </p>
    <button
      on:click={togglePasswordVisibility}
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
      title={isPasswordVisible ? "Hide password" : "Show password"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        {#if isPasswordVisible}
          <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        {:else}
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        {/if}
      </svg>
    </button>
    <button
      on:click={copyPassword}
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 ml-1"
      title="Copy password"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
      </svg>
    </button>
  </div>

  {#if entry.category}
    <div class="mt-2">
      <span class="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
        {entry.category}
      </span>
    </div>
  {/if}
</div> 