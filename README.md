```markdown
# Signal-Clone — End-to-End Encrypted Messaging Demo

## Overview

This is a minimal **Next.js** proof-of-concept implementation of Signal’s core cryptographic protocols, packaged as a demo chat app. It implements:

1. **XEdDSA & VXEdDSA**  
   • Key generation, signing (Ed25519), and signature-verified Diffie–Hellman over X25519  
2. **X3DH (Extended Triple Diffie–Hellman)**  
   • Asymmetric session setup between two parties, with static, ephemeral & one-time pre-keys  
3. **Double Ratchet**  
   • Authenticated symmetric encryption with forward secrecy and post-compromise recovery  

You can inspect and experiment with each protocol in real time on the **`/test-protocols`** page, or see them driving the chat UI at **`/chat`**.

---

## Features

- **XEdDSA / VXEdDSA**  
  • Ed25519 keypair + signature  
  • X25519 handshake for early authentication  

- **X3DH Handshake**  
  • 3 static/Ephemeral Diffie–Hellman exchanges (+ optional one-time)  
  • HKDF key derivation to a shared session secret  

- **Double Ratchet**  
  • AES-GCM encryption + HKDF ratcheting  
  • Forward secrecy & self-healing if keys leak  

- **Encrypted Logging**  
  • AES-GCM + HMAC-SHA256 wrapper (`encryptText`) for terminal logs  

- **React Chat UI**  
  • Emoji picker, file upload, “typing…” indicator via Pusher  
  • Supabase for file storage, Convex for message store  

---

## Getting Started

### Prerequisites

- Node.js ≥ 16.x  
- npm or Yarn  
- Git  

### 1. Clone & Install

```bash
git clone https://github.com/dtonda2/cs588-final-project.git
cd cs588-final-project
npm install
# or
yarn install
```

### 2. Environment

Create a `.env.local` in the project root:

```ini
# Convex
CONVEX_DEPLOYMENT=dev:energized-rooster-86
NEXT_PUBLIC_CONVEX_URL=https://energized-rooster-86.convex.cloud

# Clerk (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Stora​ge
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=sk-...

# Pusher (typing indicator)
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=mt1

# LiveKit (optional)
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://...

# Encrypted Logging
NEXT_PUBLIC_LOG_KEY=any-passphrase-you-like
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
```

- **App UI** → http://localhost:3000  
- **Protocol Test Page** → http://localhost:3000/test-protocols  

Open your **browser console** on `/test-protocols` to see step-by-step messages, keypairs, DH outputs, encryption/decryption results for each of the three protocols.

---

## How to Test

1. **Ed25519 Sign/Verify**  
   - Generates identity keypairs  
   - Signs a test message & verifies the signature  

2. **X3DH Session‐Derivation**  
   - Alice & Bob each generate identity & static pre-keys  
   - Exchange public keys + verify static pre-key signature  
   - Perform 3 DHs → derive the same 32-byte session secret  

3. **Double Ratchet**  
   - Initialize ratchet with the shared X3DH session secret  
   - Alice encrypts a message → Bob decrypts it  
   - Check that decrypted plaintext matches  

All of the above runs automatically on page load of `/test-protocols`.

---

## Production & Deployment

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

You can deploy to Vercel, Netlify, or any Node-capable host:

```bash
vercel deploy
# or
netlify deploy
```

---

## License & Acknowledgements

- This is a **student project** for CS588, inspired by the official [Signal Protocol](https://signal.org/docs/).  
- **Signal** is open source (GPL v3) — see https://github.com/signalapp  

---
```

**Changelog highlights**  
- Added explicit support for **XEdDSA/VXEdDSA**, **X3DH**, and **Double Ratchet** demos  
- Consolidated **encryptText()** helper (AES-GCM + HMAC-SHA256) for secure logging  
- Simplified README with direct instructions to the `/test-protocols` page  
- Kept original Signal overview and installation steps, plus updated env keys for logging & Pusher  
