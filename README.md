# Lychee Lock

A secure, client-side password manager with end-to-end encryption and optional 2FA.

## Features

- **Fully encrypted in-browser**: Your passwords are encrypted with the Web Crypto API before being stored.
- **Zero knowledge architecture**: Your master password is never sent to the server.
- **Optional 2FA**: Add an extra layer of security with Google Authenticator.
- **Client-side only**: No backend code to compromise security.
- **Dark mode support**: For comfortable use in low-light environments.
- **Responsive design**: Works on mobile and desktop.

## Tech Stack

- **Frontend**:
  - Svelte - UI framework
  - TailwindCSS - Styling
  - Web Crypto API - Encryption/decryption
  - otplib - 2FA TOTP handling
  - qrcode - QR code generation for 2FA

- **Database**:
  - Supabase (PostgreSQL-as-a-service)
  - Row-Level Security (RLS) for data protection
  - Only encrypted data is stored (zero knowledge)

- **Deployment**:
  - Vercel (Svelte frontend hosting)
  - Supabase (data storage)

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/lycheelock.git
   cd lycheelock
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL editor
   - Get your Supabase URL and anon key

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and anon key:
     ```
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

5. Start the development server:
   ```
   npm run dev
   ```

## Security

- All encryption/decryption happens client-side
- AES-GCM encryption with a 256-bit key
- PBKDF2 key derivation with 100,000 iterations
- TOTP-based two-factor authentication

## License

MIT
