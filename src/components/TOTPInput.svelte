<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let length = 6;
  
  const dispatch = createEventDispatcher<{
    verify: string;
    cancel: void;
  }>();
  
  let digits = Array(length).fill('');
  let inputRefs: HTMLInputElement[] = [];
  
  function handleInput(index: number) {
    // Handle number input
    if (digits[index].length > 1) {
      // If multiple characters pasted, distribute them
      const chars = digits[index].split('');
      for (let i = 0; i < chars.length && i + index < length; i++) {
        digits[i + index] = chars[i];
      }
    }
    
    // Auto focus next input
    if (digits[index] && index < length - 1) {
      inputRefs[index + 1].focus();
    }
    
    // Check if all digits are filled
    if (digits.every(d => d)) {
      const code = digits.join('');
      if (code.length === length) {
        dispatch('verify', code);
      }
    }
  }
  
  function handleKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous input if current is empty and backspace is pressed
      inputRefs[index - 1].focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      // Navigate left
      event.preventDefault();
      inputRefs[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      // Navigate right
      event.preventDefault();
      inputRefs[index + 1].focus();
    }
  }
  
  function handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const pastedDigits = pastedData.replace(/\D/g, '').split('').slice(0, length);
    
    pastedDigits.forEach((digit, i) => {
      if (i < length) {
        digits[i] = digit;
      }
    });
    
    // Focus on the next empty input or the last one
    const nextEmptyIndex = digits.findIndex(d => !d);
    if (nextEmptyIndex >= 0) {
      inputRefs[nextEmptyIndex].focus();
    } else if (inputRefs.length > 0) {
      inputRefs[length - 1].focus();
    }
    
    // Check if all digits are filled after paste
    if (digits.every(d => d)) {
      const code = digits.join('');
      if (code.length === length) {
        dispatch('verify', code);
      }
    }
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
  <h2 class="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
    Enter Your 2FA Code
  </h2>
  
  <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
    Enter the 6-digit code from your authenticator app
  </p>
  
  <!-- TOTP Input -->
  <div 
    class="flex justify-center space-x-2 mb-6"
    on:paste={handlePaste}
  >
    {#each Array(length) as _, i}
      <input
        type="text"
        inputmode="numeric"
        bind:value={digits[i]}
        on:input={() => handleInput(i)}
        on:keydown={(e) => handleKeydown(e, i)}
        bind:this={inputRefs[i]}
        class="w-12 h-14 text-center text-xl border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        maxlength="1"
        pattern="[0-9]*"
      />
    {/each}
  </div>
  
  <!-- Buttons -->
  <div class="flex justify-center space-x-3">
    <button
      type="button"
      on:click={handleCancel}
      class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Cancel
    </button>
    <button
      type="button"
      class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      on:click={() => dispatch('verify', digits.join(''))}
      disabled={!digits.every(d => d)}
    >
      Verify
    </button>
  </div>
</div> 