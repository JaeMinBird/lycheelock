<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { authStore, type User } from '../stores/auth';
  import { generateSalt, deriveKey, arrayBufferToBase64, base64ToArrayBuffer } from '$lib/crypto';
  import { generateTotpSecret, generateQRCode, verifyTotp } from '$lib/totp';
  import QRCode from '../components/QRCode.svelte';
  import TOTPInput from '../components/TOTPInput.svelte';
  
  // Form state
  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let isRegistering = false;
  let isProcessing = false;
  let errorMessage = '';
  
  // TOTP setup state
  let showTotpSetup = false;
  let showTotpInput = false;
  let totpSecret = '';
  let qrCodeUrl = '';
  
  // User authentication state
  let user: User | null = null;
  let unsubscribe: () => void;
  
  onMount(() => {
    // Subscribe to auth store to track user state
    unsubscribe = authStore.subscribe(state => {
      user = state.user;
      
      if (state.isAuthenticated) {
        if (state.isTotpVerified) {
          goto('/vault');
        } else if (user?.totp_enabled) {
          showTotpInput = true;
        }
      }
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });
  
  async function handleSubmit() {
    isProcessing = true;
    errorMessage = '';
    
    try {
      if (isRegistering) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    } finally {
      isProcessing = false;
    }
  }
  
  async function handleRegister() {
    // Validate input
    if (!username || !email || !password) {
      throw new Error('Please fill out all required fields');
    }
    
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    // Generate a salt for key derivation
    const salt = generateSalt();
    const saltBase64 = arrayBufferToBase64(salt.buffer);
    
    // Derive a key from the password
    const masterKey = await deriveKey(password, salt);
    
    // Generate a TOTP secret
    totpSecret = generateTotpSecret();
    qrCodeUrl = generateQRCode(username, totpSecret);
    
    // Store the user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        salt: saltBase64,
        totp_secret: totpSecret,
        totp_enabled: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Set the auth state
    authStore.setUser({
      id: data.id,
      username: data.username,
      email: data.email,
      totp_enabled: true
    });
    authStore.setMasterKey(masterKey);
    authStore.setSalt(salt);
    authStore.setAuthenticated(true);
    
    // Show TOTP setup
    showTotpSetup = true;
  }
  
  async function handleLogin() {
    // Validate input
    if (!username || !password) {
      throw new Error('Please fill out all required fields');
    }
    
    // Look up the user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      throw new Error('Invalid username or password');
    }
    
    // Get the salt and derive the key
    const salt = new Uint8Array(base64ToArrayBuffer(data.salt));
    const masterKey = await deriveKey(password, salt);
    
    // Set the auth state
    authStore.setUser({
      id: data.id,
      username: data.username,
      email: data.email,
      totp_enabled: data.totp_enabled
    });
    authStore.setMasterKey(masterKey);
    authStore.setSalt(salt);
    authStore.setAuthenticated(true);
    
    // If TOTP is enabled, show the TOTP input
    if (data.totp_enabled) {
      totpSecret = data.totp_secret;
      showTotpInput = true;
    } else {
      // No TOTP, go directly to vault
      goto('/vault');
    }
  }
  
  function toggleMode() {
    isRegistering = !isRegistering;
    errorMessage = '';
  }
  
  function handleTotpVerify(event: CustomEvent<string>) {
    const token = event.detail;
    
    // Verify the TOTP
    if (verifyTotp(token, totpSecret)) {
      authStore.setTotpVerified(true);
      goto('/vault');
    } else {
      errorMessage = 'Invalid verification code';
    }
  }
  
  function handleTotpSetupComplete() {
    // TOTP has been set up, show input for verification
    showTotpSetup = false;
    showTotpInput = true;
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
        Lychee Lock
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Secure, client-side password management
      </p>
    </div>
    
    {#if showTotpSetup}
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 class="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
          Set Up Two-Factor Authentication
        </h2>
        
        <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
          Scan this QR code with your authenticator app (like Google Authenticator)
        </p>
        
        <div class="flex justify-center mb-6">
          <QRCode dataUrl={qrCodeUrl} alt="TOTP QR Code" size={200} />
        </div>
        
        <div class="mb-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
            If you can't scan the QR code, enter this code manually:
          </p>
          <div class="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded text-center font-mono text-sm select-all">
            {totpSecret}
          </div>
        </div>
        
        <div class="flex justify-center">
          <button
            on:click={handleTotpSetupComplete}
            class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Continue
          </button>
        </div>
      </div>
    {:else if showTotpInput}
      <TOTPInput on:verify={handleTotpVerify} on:cancel={() => authStore.logout()} />
      
      {#if errorMessage}
        <div class="mt-4 text-center text-red-500 dark:text-red-400">
          {errorMessage}
        </div>
      {/if}
    {:else}
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          {isRegistering ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              bind:value={username}
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your username"
            />
          </div>
          
          {#if isRegistering}
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                bind:value={email}
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
              />
            </div>
          {/if}
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Master Password
            </label>
            <input
              type="password"
              id="password"
              bind:value={password}
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={isRegistering ? 'Create a strong master password' : 'Enter your master password'}
            />
          </div>
          
          {#if isRegistering}
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Master Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                bind:value={confirmPassword}
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm your master password"
              />
            </div>
          {/if}
          
          {#if errorMessage}
            <div class="text-red-500 dark:text-red-400 text-sm">
              {errorMessage}
            </div>
          {/if}
          
          <div>
            <button
              type="submit"
              disabled={isProcessing}
              class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isProcessing}
                <span class="inline-block animate-spin mr-2">⟳</span>
                Processing...
              {:else}
                {isRegistering ? 'Create Account' : 'Log In'}
              {/if}
            </button>
          </div>
        </form>
        
        <div class="mt-6 text-center">
          <button
            on:click={toggleMode}
            class="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            {isRegistering ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    {/if}
    
    <div class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>All data is encrypted in your browser before being stored.</p>
      <p>Your master password is never sent to any server.</p>
    </div>
  </div>
</div>
