# Signal - End-to-End Encrypted Messaging App

## Overview
Signal is a secure, open-source messaging application designed to provide **end-to-end encrypted communication** for users worldwide. It ensures **privacy, security, and anonymity** while enabling seamless messaging, voice, and video calls. Unlike conventional messaging platforms, Signal does not collect metadata, ensuring that even Signal itself cannot access user messages or calls. The application is widely used by activists, journalists, and privacy-conscious individuals who require a high level of security.

Signal’s commitment to privacy extends beyond encryption; it does not store user data, making it impossible for third parties to track conversations. Unlike other messaging apps, Signal relies on **zero-knowledge architecture**, meaning that user contacts, group memberships, and message history are never stored on Signal’s servers. As an open-source project, Signal allows security experts to audit its code, ensuring that no vulnerabilities exist. With no advertisements or tracking mechanisms, Signal remains a truly private messaging solution.

## Features
- **End-to-End Encryption:** Messages and calls are encrypted using **Signal Protocol**.
- **Private Messaging:** Secure one-on-one and group chats.
- **Encrypted Voice & Video Calls:** High-quality calls with encryption.
- **Self-Destructing Messages:** Set messages to disappear after a specific time.
- **Screen Security:** Prevents screenshots of conversations.
- **Open-Source:** Publicly available for security audits.
- **No Ads, No Trackers:** Ensures complete privacy.

## Security
Signal is built on a strong cryptographic foundation, leveraging the **Signal Protocol**, which is widely regarded as one of the most secure messaging encryption protocols available today. It ensures **end-to-end encryption (E2EE)** for messages, calls, and attachments, meaning that no third party—including Signal itself—can access user data.

### Key Security Features:
1. **Double Ratchet Algorithm:** This mechanism provides forward secrecy by ensuring that past messages remain secure, even if future encryption keys are compromised. It continuously updates encryption keys with every message exchanged, preventing attackers from decrypting past communications.

2. **Curve25519, AES-256, and HMAC-SHA256:** These cryptographic techniques ensure that encryption remains robust. **Curve25519** is used for key exchange, **AES-256** for message encryption, and **HMAC-SHA256** for message integrity verification.

3. **Perfect Forward Secrecy (PFS):** Even if a user’s private key is exposed, past messages cannot be decrypted. This is crucial for preventing retroactive data breaches.

4. **Sealed Sender Technology:** Signal ensures that even it cannot determine who is messaging whom. This feature conceals metadata such as sender and recipient details, making it impossible for servers to analyze user communication patterns.

5. **Zero-Knowledge Architecture:** Signal does not store user data, contact lists, or group membership information. This means that even if its servers were compromised, attackers would gain no usable information.

6. **Self-Destructing Messages:** Users can configure messages to disappear after a set time, reducing the risk of long-term data exposure.

7. **No Cloud Backup of Messages:** Unlike other messaging apps that store chat histories in cloud backups (which can be accessed by governments or hackers), Signal avoids cloud storage, keeping all messages stored only on the user’s device.

8. **Independent Security Audits:** Being open-source, Signal allows independent researchers to inspect and verify its security measures. Frequent audits ensure vulnerabilities are identified and patched quickly.

Signal’s commitment to security makes it the go-to choice for those who require **absolute privacy**, including journalists, activists, and individuals operating in high-risk environments. With a combination of strong encryption, minimal data retention, and cutting-edge security practices, Signal remains the industry leader in private communication.

## Prerequisites
Before installing and running Signal, ensure you have the following:
- **Operating System:** Windows, macOS, Linux (for desktop), or Android/iOS (for mobile).
- **Node.js (for Next.js app):** `>= 16.x`
- **npm or yarn**
- **Git** (for cloning the repository)

## Installation and Running the Next.js App

### 1. Clone the Repository
```sh
git clone https://github.com/dtonda2/cs588-final-project.git
cd cs588-final-project
```

### 2. Install Dependencies
```sh
npm install
# OR
yarn install
```

### 3. Set Up Environment Variables
Create a **.env.local** file in the root directory and add the following:
```env
CONVEX_DEPLOYMENT=dev:energized-rooster-86
NEXT_PUBLIC_CONVEX_URL=https://energized-rooster-86.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmFwaWQtdHVydGxlLTU0LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_4fAcDVBwl1oSxkflIop7WhhtF9lzrxg2jg0WklPz5X
CLERK_WEBHOOK_SECRET=whsec_WTeEN4IN80QhjBNDOLf2YfHf8MKZh1GF
NEXT_PUBLIC_SUPABASE_URL=https://ejdrvqoexhtwzyftsekn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZHJ2cW9leGh0d3p5ZnRzZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNTgyNjksImV4cCI6MjA1ODYzNDI2OX0.Tq7XkHm-8zJXr97TbCF91ZQQt_Py0fX-w5WxNeeVGVg
NEXT_PUBLIC_PUSHER_KEY=12e789b0a72b42826fcc
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
PUSHER_APP_ID=1965335
PUSHER_KEY=12e789b0a72b42826fcc
PUSHER_SECRET=6919642ff7a1f19db16e
PUSHER_CLUSTER=mt1
LIVEKIT_API_KEY=APIrE86UWG2vvBC
LIVEKIT_API_SECRET=prkCWB0teAmgUNV2UbH2ytAxU4jSfy6NpOJWAvE4V43
NEXT_PUBLIC_LIVEKIT_URL=wss://signal-a7gjxtqf.livekit.cloud

```

### 4. Start the Development Server
```sh
npm run dev
# OR
yarn dev
```
This will start the app at `http://localhost:3000`

### 5. Building for Production
```sh
npm run build
npm run start
# OR
yarn build
yarn start
```

### 6. Running Tests
```sh
npm test
# OR
yarn test
```

## Deployment
Deploy Signal Next.js app on Vercel, Netlify, or a custom server:
```sh
vercel deploy
# OR
netlify deploy
```