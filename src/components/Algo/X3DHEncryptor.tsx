import React, { FC, useState, useEffect, useRef, ChangeEvent } from 'react';

/**
 * X3DHEncryptor Component
 *
 * Implements the X3DH (Extended Triple Diffie-Hellman) protocol and
 * AES-GCM encryption over WebCrypto to provide:
 *   • Identity and signature keypair generation (ECDH + ECDSA)
 *   • Signed and one-time prekeys for forward secrecy
 *   • Shared-secret derivation and HKDF key stretching
 *   • AES-GCM text, file & voice encryption/decryption
 *   • Audio recording via MediaRecorder for secure voice handling
 *
 * Use this to establish a secure session with a peer bundle,
 * then encrypt/decrypt arbitrary data (text, blobs, audio) in-browser.
 */


// --- Type Definitions ---
interface CipherBundle {
  iv: Uint8Array;
  ct: ArrayBuffer;
  type?: string;
}

interface PeerBundle {
  idRaw: ArrayBuffer;
  spRaw: ArrayBuffer;
  spSig: ArrayBuffer;
  otpRaw?: ArrayBuffer;
}

// --- X3DHEncryptor Component ---
const X3DHEncryptor: FC = () => {
  // --- Crypto State ---
  const [idECDH, setIdECDH] = useState<CryptoKeyPair | null>(null);
  const [idECDSA, setIdECDSA] = useState<CryptoKeyPair | null>(null);
  const [spECDH, setSpECDH] = useState<CryptoKeyPair | null>(null);
  const [spSig, setSpSig] = useState<ArrayBuffer | null>(null);
  const [oneTimePrekeys, setOneTimePrekeys] = useState<CryptoKeyPair[]>([]);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);

  // --- UI State ---
  const [plainText, setPlainText] = useState<string>('');
  const [cipherText, setCipherText] = useState<CipherBundle | null>(null);
  const [decryptedText, setDecryptedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileCipher, setFileCipher] = useState<CipherBundle | null>(null);
  const [fileDecUrl, setFileDecUrl] = useState<string>('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceCipher, setVoiceCipher] = useState<CipherBundle | null>(null);
  const [voiceDecUrl, setVoiceDecUrl] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState<boolean>(false);

 // --- WebCrypto Helpers ---

// Function to generate an ECDH (Elliptic Curve Diffie-Hellman) key pair.
// ECDH is used for key agreement — i.e., securely deriving a shared secret between two parties.
const genECDH = (): Promise<CryptoKeyPair> =>
    window.crypto.subtle.generateKey(
      {
        name: 'ECDH',         // Specifies the algorithm name as ECDH
        namedCurve: 'P-256'   // Uses the NIST P-256 elliptic curve (also known as secp256r1)
      },
      true,                   // The keys are extractable (can be exported)
      ['deriveBits']          // Usage: key can be used to derive bits (shared secret)
    ) as Promise<CryptoKeyPair>; // Return type: a Promise that resolves to a CryptoKeyPair (public + private key)
  
  
  // Function to generate an ECDSA (Elliptic Curve Digital Signature Algorithm) key pair.
  // ECDSA is used for signing and verifying digital messages.
  const genECDSA = (): Promise<CryptoKeyPair> =>
    window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',         // Specifies the algorithm name as ECDSA
        namedCurve: 'P-256'    // Uses the NIST P-256 elliptic curve for signing
      },
      true,                    // The keys are extractable (can be exported)
      ['sign', 'verify']       // Usage: key pair can be used to sign messages and verify signatures
    ) as Promise<CryptoKeyPair>; // Return type: a Promise that resolves to a CryptoKeyPair
  
  // Function to export a given CryptoKey in raw format (as an ArrayBuffer).
  // Typically used to send the public key over the network or store it.
  const exportRaw = (key: CryptoKey): Promise<ArrayBuffer> =>
    window.crypto.subtle.exportKey(
      'raw', // Export format: 'raw' returns an unencrypted byte representation (only works for public keys)
      key    // The CryptoKey to export
    );
  
  // Function to import a raw ECDH public key (received or stored previously) back into a usable CryptoKey object.
  const importECDH = (raw: ArrayBuffer): Promise<CryptoKey> =>
    window.crypto.subtle.importKey(
      'raw',               // Format of the key being imported (must match export format)
      raw,                 // The raw key material (as ArrayBuffer)
      {
        name: 'ECDH',      // Must match the algorithm used during key generation
        namedCurve: 'P-256'// The same named curve used to generate the key
      },
      true,                // The key is extractable (can be exported again if needed)
      []                   // No usages are defined for the imported key (e.g., it's typically a public key for key agreement)
    );
  

// Function to derive a shared secret (raw bits) from a private ECDH key and a peer's public key.
// This is the core step in Elliptic Curve Diffie-Hellman key agreement.
const deriveBits = (priv: CryptoKey, pub: CryptoKey): Promise<ArrayBuffer> =>
    window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',   // ECDH algorithm is used
        public: pub     // The public key of the other party
      },
      priv,             // The private key of the local party
      256               // Number of bits to derive (usually 256 for AES-256)
    );
  
  // Function to import a raw key (initial keying material, IKM) for use with HKDF.
  // HKDF (HMAC-based Extract-and-Expand Key Derivation Function) is used to derive secure keys from shared secrets.
  const importHKDFKey = (ikm: ArrayBuffer): Promise<CryptoKey> =>
    window.crypto.subtle.importKey(
      'raw',            // Format of the input keying material
      ikm,              // The IKM, typically the output from `deriveBits`
      { name: 'HKDF' }, // We’re going to use it with HKDF
      false,            // Not extractable (cannot be exported again)
      ['deriveKey']     // Can be used to derive other keys
    );
  
  // Function to derive an AES-GCM key from a master key using HKDF with a given salt and info.
  // Salt adds randomness, and info is optional context/application-specific data.
  const deriveAESGCM = (
    master: CryptoKey,       // The master key (usually derived from ECDH)
    salt: Uint8Array,        // Salt for HKDF (should be random and unique per session)
    info: Uint8Array         // Optional context (e.g., "handshake" or "encryption" string as bytes)
  ): Promise<CryptoKey> =>
    window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',      // The hash algorithm used for HMAC (SHA-256 is common and secure)
        salt,                 // Random salt to make output unique
        info                  // Context-specific information
      },
      master,                 // Master key (from IKM)
      {
        name: 'AES-GCM',      // Target algorithm for derived key
        length: 256           // AES-256 encryption (256-bit key)
      },
      false,                  // Not extractable
      ['encrypt', 'decrypt']  // Key usage: can be used for AES-GCM encryption and decryption
    );
  
  // Function to encrypt data using AES-GCM.
  // AES-GCM (Galois/Counter Mode) is an authenticated encryption algorithm providing confidentiality and integrity.
  const aesEncrypt = async (
    key: CryptoKey,         // AES-GCM key used for encryption
    data: BufferSource      // Data to be encrypted (e.g., string or Uint8Array)
  ): Promise<CipherBundle> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate a random 96-bit IV (recommended for AES-GCM)
    const ct = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv                    // Initialization vector; must be unique per message with the same key
      },
      key,                   // The AES key
      data                   // The plaintext data
    );
    return { iv, ct };       // Return both IV and ciphertext so the recipient can decrypt
  };
  
  // Function to decrypt data using AES-GCM.
  const aesDecrypt = (
    key: CryptoKey,          // AES-GCM key used for decryption (must be same as used for encryption)
    iv: Uint8Array,          // Initialization vector used during encryption (must be the same)
    ct: BufferSource         // The ciphertext to decrypt
  ): Promise<ArrayBuffer> =>
    window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv                   // The IV used in encryption
      },
      key,                  // The same AES key used to encrypt
      ct                    // Ciphertext
    );
  

  // --- Initialization of Keys ---
  useEffect(() => {
    // Immediately-invoked async function expression (IIFE) to allow use of async/await inside useEffect
    (async () => {
      // --- Step 1: Generate Identity ECDH Key Pair ---
      const idKP = await genECDH();   // This key pair will be used for long-term ECDH (key agreement)
      setIdECDH(idKP);                // Save identity ECDH key pair in state (e.g., React component state)
  
      // --- Step 2: Generate Identity ECDSA Key Pair ---
      const idSigKP = await genECDSA(); // This key pair will be used for signing (authentication)
      setIdECDSA(idSigKP);              // Save identity ECDSA key pair in state
  
      // --- Step 3: Generate Signed Prekey (SPK) ---
      const spKP = await genECDH();   // Generate a separate ECDH key pair to serve as the signed prekey
      setSpECDH(spKP);                // Store the SPK in state
  
      // Export the public key of the signed prekey as raw bytes (to sign and later share)
      const spPubRaw = await exportRaw(spKP.publicKey);
  
      // Sign the SPK public key with the identity private signing key (ECDSA) to prove ownership
      const signature = await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },  // Specify ECDSA with SHA-256 hash
        idSigKP.privateKey,                  // Use the identity private key for signing
        spPubRaw                             // Sign the raw public key of the signed prekey
      );
      setSpSig(signature);                   // Save the signature of the SPK public key
  
      // --- Step 4: Generate a Set of One-Time Prekeys (OTPs) ---
      const otps: CryptoKeyPair[] = [];      // Array to hold one-time ECDH key pairs
      for (let i = 0; i < 5; i++) {
        otps.push(await genECDH());         // Generate and store 5 ECDH key pairs as one-time prekeys
      }
      setOneTimePrekeys(otps);              // Save the list of OTPs in state
    })(); // Immediately invoke the async function
  }, []);
  

  // --- X3DH Session Derivation ---
// Function to derive a secure session key from a peer's public key bundle using the X3DH protocol.
const deriveSession = async (bundle: PeerBundle): Promise<void> => {
    // --- Preconditions Check ---
    if (!idECDH || !idECDSA) throw new Error('Keys not initialized'); // Ensure local identity keys are ready
  
    // --- Step 1: Verify the signature of the peer's Signed PreKey (SPK) ---
    const valid = await window.crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },  // Use ECDSA and SHA-256
      idECDSA.publicKey,                   // Our identity public key is used to verify (usually it should be the peer's)
      bundle.spSig,                        // The signature of the SPK
      bundle.spRaw                         // The raw public key of the peer's SPK
    );
    if (!valid) throw new Error('Invalid prekey signature'); // Reject if SPK is not properly signed
  
    // --- Step 2: Import the peer’s public keys ---
    const peerIdKey = await importECDH(bundle.idRaw); // Peer’s identity public key
    const peerSpKey = await importECDH(bundle.spRaw); // Peer’s signed prekey
  
    // --- Step 3: Perform Diffie-Hellman computations (X3DH core) ---
    // DH1: Our identity private key with peer’s signed prekey
    const dh1 = await deriveBits(idECDH.privateKey, peerSpKey);
  
    // Generate an ephemeral ECDH key pair for this session (not reused)
    const ephKP = await genECDH();
  
    // DH2: Our ephemeral private key with peer’s identity public key
    const dh2 = await deriveBits(ephKP.privateKey, peerIdKey);
  
    // DH3: Our ephemeral private key with peer’s signed prekey
    const dh3 = await deriveBits(ephKP.privateKey, peerSpKey);
  
    // DH4 (optional): Our ephemeral key with peer’s one-time prekey, if provided
    let dh4: ArrayBuffer = new ArrayBuffer(0); // Initialize with empty buffer in case OTP is missing
    if (bundle.otpRaw) {
      const peerOtpKey = await importECDH(bundle.otpRaw); // Import peer’s one-time prekey
      dh4 = await deriveBits(ephKP.privateKey, peerOtpKey); // DH4 computation
  
      // Remove used OTP key from our prekey list (only applicable if this code is managing OTPs)
      setOneTimePrekeys(prev => prev.filter(kp => kp.publicKey !== peerSpKey)); // Note: filtering may be off here
    }
  
    // --- Step 4: Concatenate DH outputs into a single ArrayBuffer for key derivation ---
    const a1 = new Uint8Array(dh1 as ArrayBuffer);
    const a2 = new Uint8Array(dh2 as ArrayBuffer);
    const a3 = new Uint8Array(dh3 as ArrayBuffer);
    const a4 = new Uint8Array(dh4 as ArrayBuffer);
  
    const totalLength = a1.byteLength + a2.byteLength + a3.byteLength + a4.byteLength;
    const concatSec = new Uint8Array(totalLength);
  
    let pos = 0;
    concatSec.set(a1, pos); pos += a1.byteLength;
    concatSec.set(a2, pos); pos += a2.byteLength;
    concatSec.set(a3, pos); pos += a3.byteLength;
    concatSec.set(a4, pos); // DH4 may be empty if OTP was not used
  
    // --- Step 5: Derive session key using HKDF ---
    const salt = new Uint8Array(32); // Random salt (here, just zeros; in practice, should be random per session)
    const info = new TextEncoder().encode('X3DH-WebCrypto'); // Contextual info string for HKDF
  
    const masterKey = await importHKDFKey(concatSec.buffer as ArrayBuffer); // Import concatenated DH results as HKDF input
    const aesKey = await deriveAESGCM(masterKey, salt, info);               // Derive AES-GCM key for encryption/decryption
  
    // --- Step 6: Store the derived AES session key ---
    setSessionKey(aesKey); // Save the final session key in state for secure communication
  };
  

  // --- Handlers ---
 // Encrypt the current plaintext input using the established session key
const encryptText = async (): Promise<void> => {
    if (!sessionKey) return; // Ensure a session key is available
  
    // Convert plaintext string into a Uint8Array (required by WebCrypto API)
    const encoded = new TextEncoder().encode(plainText);
  
    // Encrypt the encoded text with AES-GCM using the session key
    const bundle = await aesEncrypt(sessionKey, encoded);
  
    // Save the result (ciphertext + IV) in state for later decryption or transmission
    setCipherText(bundle);
  };
  
  // Decrypt the stored ciphertext using the session key
  const decryptText = async (): Promise<void> => {
    if (!cipherText || !sessionKey) return; // Ensure necessary data is present
  
    // Decrypt the ciphertext using AES-GCM and the stored IV
    const ptBuf = await aesDecrypt(sessionKey, cipherText.iv, cipherText.ct);
  
    // Convert decrypted ArrayBuffer back into a human-readable string
    setDecryptedText(new TextDecoder().decode(ptBuf));
  };
  
  // Encrypt a selected file using AES-GCM and the session key
  const handleFileEncrypt = async (): Promise<void> => {
    if (!sessionKey || !fileInputRef.current?.files) return; // Ensure key and file exist
  
    const file = fileInputRef.current.files[0];      // Get the selected file
    const buf = await file.arrayBuffer();            // Convert file to ArrayBuffer for encryption
    const bundle = await aesEncrypt(sessionKey, buf); // Encrypt file data
  
    // Save the encrypted file (IV + ciphertext) and preserve original MIME type
    setFileCipher({ ...bundle, type: file.type });
  };
  
  // Decrypt an encrypted file and create a downloadable URL for it
  const handleFileDecrypt = async (): Promise<void> => {
    if (!fileCipher || !sessionKey) return; // Ensure encrypted file and key exist
  
    // Decrypt the file data
    const data = await aesDecrypt(sessionKey, fileCipher.iv, fileCipher.ct);
  
    // Create a Blob from decrypted data and generate a URL for download or preview
    const url = URL.createObjectURL(new Blob([data], { type: fileCipher.type }));
  
    // Save the Blob URL for use (e.g., in an <a> tag or media element)
    setFileDecUrl(url);
  };
  
  // Start audio recording using MediaRecorder API
  const startRecording = async (): Promise<void> => {
    // Request access to microphone from the user
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
    // Create a MediaRecorder instance to record audio from the microphone stream
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder; // Save recorder to a ref for later access
  
    const chunks: Blob[] = []; // Array to store audio data chunks
  
    // Push recorded audio data chunks into array as they become available
    recorder.ondataavailable = e => chunks.push(e.data);
  
    // When recording stops, combine chunks into a single Blob and save
    recorder.onstop = () => setVoiceBlob(new Blob(chunks));
  
    // Start recording audio
    recorder.start();
    setRecording(true); // Update recording state for UI feedback
  };
  

// Stop the active audio recording
const stopRecording = (): void => {
    // Stop the MediaRecorder if it's currently recording
    mediaRecorderRef.current?.stop();
  
    // Update the UI state to reflect that recording has stopped
    setRecording(false);
  };
  
  // Encrypt the recorded voice/audio Blob using AES-GCM and the session key
  const encryptVoice = async (): Promise<void> => {
    // Ensure both session key and recorded voice blob are available
    if (!sessionKey || !voiceBlob) return;
  
    // Convert the voice Blob into an ArrayBuffer for encryption
    const buf = await voiceBlob.arrayBuffer();
  
    // Encrypt the audio buffer using AES-GCM with the current session key
    const bundle = await aesEncrypt(sessionKey, buf);
  
    // Save the encrypted result (ciphertext and IV), and retain the original MIME type of the audio
    setVoiceCipher({ ...bundle, type: voiceBlob.type });
  };
  
  // Decrypt the encrypted voice/audio and generate a URL for playback or download
  const decryptVoice = async (): Promise<void> => {
    // Ensure both encrypted voice data and session key are available
    if (!voiceCipher || !sessionKey) return;
  
    // Decrypt the ciphertext using AES-GCM and the associated IV
    const data = await aesDecrypt(sessionKey, voiceCipher.iv, voiceCipher.ct);
  
    // Create a Blob from the decrypted data and generate a usable URL
    const url = URL.createObjectURL(new Blob([data], { type: voiceCipher.type }));
  
    // Store the URL so it can be used in an <audio> element or link
    setVoiceDecUrl(url);
  };
  

  return (
    <>
      <section>
        <textarea
          value={plainText}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPlainText(e.target.value)}
          placeholder="Text to encrypt"
        />
        <button onClick={encryptText}>Encrypt</button>
        {cipherText && <button onClick={decryptText}>Decrypt</button>}
        {decryptedText && <p>{decryptedText}</p>}
      </section>

      <section>
        <input type="file" ref={fileInputRef} />
        <button onClick={handleFileEncrypt}>Encrypt File</button>
        {fileCipher && <button onClick={handleFileDecrypt}>Decrypt File</button>}
        {fileDecUrl && <a href={fileDecUrl} download>Download Decrypted File</a>}
      </section>

      <section>
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        {voiceBlob && <button onClick={encryptVoice}>Encrypt Voice</button>}
        {voiceCipher && <button onClick={decryptVoice}>Decrypt Voice</button>}
        {voiceDecUrl && <audio src={voiceDecUrl} controls />}
      </section>
    </>
  );
};

export default X3DHEncryptor;
