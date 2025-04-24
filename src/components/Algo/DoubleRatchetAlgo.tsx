// components/SecureMessage.tsx
'use client';

import React, { useState, useRef, useEffect, FC } from 'react';
import dynamic from 'next/dynamic';

// ==== DOUBLE-RATCHET IMPLEMENTATION ====
// =============================================================================
// DoubleRatchetAlgo.tsx
// A Next.js “client” component that implements the Double Ratchet encryption
// protocol (Signal’s core ratchet) using the Web Crypto API, and exposes a
// simple UI for sending/receiving encrypted text, files or voice blobs.
// - Fully typed in TypeScript
// - No SSR: loaded dynamically for browser-only Web Crypto usage
// - Advanced: uses ECDH (P-256), HKDF-SHA256, AES-GCM
// =============================================================================

const MAX_SKIP = 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * importHKDFKey:
 * Converts raw key material into a CryptoKey for HKDF operations.
 *
 * @param raw - A raw ArrayBuffer containing secret key bytes (e.g., 32 bytes).
 * @returns A CryptoKey object that can be used with deriveBits().
 */
async function importHKDFKey(raw: ArrayBuffer): Promise<CryptoKey> {
  // Import the raw key into the Web Crypto API under the HKDF algorithm.
  // - format: 'raw' means we're providing raw bytes.
  // - raw: the ArrayBuffer containing our secret key.
  // - algorithm: { name: 'HKDF' } specifies we want an HKDF key.
  // - extractable: false prevents exporting the key later, for security.
  // - keyUsages: ['deriveBits'] allows us to call deriveBits() on this key.
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
}

/**
 * deriveHKDFBits:
 * Performs the extract-and-expand steps of HKDF-SHA256 to produce pseudo-
 * random output of the desired length.
 *
 * @param key    - A CryptoKey previously imported for HKDF.
 * @param salt   - A non-secret salt (Uint8Array) used in the extract phase.
 * @param info   - Context/application-specific info (Uint8Array) used in expand.
 * @param length - Number of bits of output to derive (must be <= 8 * max length).
 * @returns A promise resolving to an ArrayBuffer containing the derived bits.
 */
async function deriveHKDFBits(
  key: CryptoKey,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<ArrayBuffer> {
  // Derive bits via HKDF:
  // - name: 'HKDF' indicates the algorithm.
  // - hash: 'SHA-256' selects the hash function for HMAC internally.
  // - salt: mixes in randomness/uniqueness in the extract stage.
  // - info: binds the output to a specific application context.
  // - key: our base key material for both extract and expand.
  // - length: how many bits to generate (e.g., 256 or 512).
  return crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info
    },
    key,
    length
  );
}
/**
 * generateDH:
 *   Creates a new ephemeral ECDH key pair using the P-256 curve.
 *   These keys are used for Diffie–Hellman operations in the ratchet.
 *
 * @returns A Promise resolving to a CryptoKeyPair with:
 *   - publicKey:   ECDH public key (exportable for transmission)
 *   - privateKey:  ECDH private key (non-exportable by default, kept secret)
 */
async function generateDH(): Promise<CryptoKeyPair> {
  // crypto.subtle.generateKey parameters:
  //  • algorithm: { name: 'ECDH', namedCurve: 'P-256' }
  //     - ECDH: Elliptic-curve Diffie–Hellman key agreement
  //     - P-256: NIST curve P-256 (also known as secp256r1), common choice
  //  • extractable: true
  //     - allows exporting the public key (and private if needed) via exportKey()
  //  • keyUsages: ['deriveKey', 'deriveBits']
  //     - deriveKey: ability to derive a symmetric key from the shared secret
  //     - deriveBits: ability to derive raw bits from the shared secret
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  ) as Promise<CryptoKeyPair>;
}

/**
 * DH:
 *   Performs the ECDH key agreement operation between our private key
 *   and the remote party’s public key, returning the raw shared secret bits.
 *
 * @param privateKey - Our local ECDH private CryptoKey
 * @param publicKey  - Their ECDH public CryptoKey
 * @returns A Promise resolving to an ArrayBuffer containing exactly 256 bits
 *          (32 bytes) of shared secret material. This output should then be
 *          fed into a KDF (e.g., HKDF) before use as encryption keys.
 */
async function DH(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  // crypto.subtle.deriveBits parameters:
  //  • algorithm: { name: 'ECDH', public: publicKey }
  //     - specify we’re doing Elliptic-curve DH with their public key
  //  • baseKey: our private CryptoKey
  //  • length: 256
  //     - number of bits to derive; P-256 yields a 256-bit shared secret
  return crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );
}

/** 
 * KDF_RK: Given the current root key and a Diffie–Hellman output, 
 * derive a new root key and a new chain key using HKDF-SHA256.
 */
async function KDF_RK(
  rootKey: ArrayBuffer,  // existing 32-byte root key
  dhOut: ArrayBuffer     // 32-byte DH shared secret
): Promise<{ rootKey: ArrayBuffer; chainKey: ArrayBuffer }> {
  // 1. Turn the raw rootKey into an HKDF CryptoKey we can derive from
  const hk = await importHKDFKey(rootKey);

  // 2. Use the rootKey itself as the HKDF salt (adds entropy and ensures uniqueness)
  const salt = new Uint8Array(rootKey);

  // 3. Set an application-specific "info" parameter to namespace this KDF
  //    so we don’t accidentally collide with other HKDF usages.
  const info = encoder.encode('DoubleRatchetRK');

  // 4. Run HKDF to produce 512 bits (64 bytes) of output:
  //    - first half (32 bytes) → new root key
  //    - second half (32 bytes) → new chain key
  const bits = await deriveHKDFBits(hk, salt, info, 512);

  // 5. Convert the raw bits into a Uint8Array for easy slicing
  const out = new Uint8Array(bits);

  // 6. Split into two 32-byte buffers and return them
  return {
    rootKey: out.slice(0, 32).buffer,   // bytes [0..31]
    chainKey: out.slice(32, 64).buffer  // bytes [32..63]
  };
}

/** 
 * KDF_CK: Given the current chain key, derive the next chain key and a one-time message key.
 * This is the “symmetric ratchet” step for each message.
 */
async function KDF_CK(
  chainKey: ArrayBuffer  // existing 32-byte chain key
): Promise<{ chainKey: ArrayBuffer; messageKey: ArrayBuffer }> {
  // 1. Import the chainKey as an HKDF CryptoKey
  const hk = await importHKDFKey(chainKey);

  // 2. Use the chainKey itself as the HKDF salt
  const salt = new Uint8Array(chainKey);

  // 3. Use a distinct info label so this derivation stays separate from root-KDF
  const info = encoder.encode('DoubleRatchetCK');

  // 4. Derive 512 bits (64 bytes):
  //    - first 32 bytes → next chain key
  //    - next 32 bytes → one-time message key
  const bits = await deriveHKDFBits(hk, salt, info, 512);

  // 5. Wrap in Uint8Array for slicing
  const out = new Uint8Array(bits);

  // 6. Return both new chainKey and messageKey
  return {
    chainKey: out.slice(0, 32).buffer,     // bytes [0..31]
    messageKey: out.slice(32, 64).buffer   // bytes [32..63]
  };
}

/**
 * encryptAEAD:
 *   Encrypts data using AES-GCM with a fresh 12-byte IV per message.
 *   Prepends the IV to the ciphertext so it can be used during decryption.
 *
 * @param mk        - 32-byte message key (raw ArrayBuffer) for AES-GCM
 * @param plaintext - Uint8Array of data to encrypt
 * @param ad        - Uint8Array of associated data to authenticate (not encrypted)
 * @returns         - Uint8Array containing [IV || ciphertext || authTag]
 */
async function encryptAEAD(
  mk: ArrayBuffer,
  plaintext: Uint8Array,
  ad: Uint8Array
): Promise<Uint8Array> {
  // 1) Import the raw message key into a usable CryptoKey for AES-GCM.
  //    - format: 'raw' because mk is raw bytes
  //    - algorithm: { name: 'AES-GCM' }
  //    - extractable: false to prevent key export
  //    - keyUsages: ['encrypt'] so we can call subtle.encrypt()
  const key = await crypto.subtle.importKey(
    'raw',
    mk,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // 2) Generate a fresh 12-byte (96-bit) IV for AES-GCM.
  //    AES-GCM standard recommends 96-bit nonces for efficiency and safety.
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3) Perform the encryption:
  //    - iv: the random nonce
  //    - additionalData: the AD to authenticate but not encrypt
  //    - plaintext: the data to be encrypted
  //    The result is an ArrayBuffer containing [ciphertext || authTag].
  const ctBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: ad },
    key,
    plaintext
  );

  // 4) Wrap the result in a Uint8Array for easier concatenation.
  const ct = new Uint8Array(ctBuffer);

  // 5) Allocate an output buffer to hold IV + ciphertext+tag in one package.
  const out = new Uint8Array(iv.length + ct.length);

  // 6) Copy IV into the beginning of the output buffer.
  out.set(iv, 0);

  // 7) Append ciphertext+authTag immediately after the IV.
  out.set(ct, iv.length);

  // 8) Return the combined buffer. Receiver will slice off the first 12 bytes
  //    as the IV before calling AES-GCM decrypt.
  return out;
}

/** 
 * AEAD-Decrypt with AES-GCM (expects the 12-byte IV to be prepended to `data`)
 *
 * @param mk   - 32-byte message key (raw ArrayBuffer) used for AES-GCM
 * @param data - Uint8Array containing [ IV (12 bytes) || ciphertext || authTag ]
 * @param ad   - Uint8Array of associated data that was authenticated during encryption
 * @returns    - A Promise resolving to the decrypted plaintext as a Uint8Array
 */
async function decryptAEAD(
  mk: ArrayBuffer,
  data: Uint8Array,
  ad: Uint8Array
): Promise<Uint8Array> {
  // 1) Slice off the first 12 bytes as the IV (nonce) for decryption.
  const iv = data.slice(0, 12);

  // 2) The remainder is the AES-GCM ciphertext + authentication tag.
  const ct = data.slice(12);

  // 3) Import the raw message key into a CryptoKey for AES-GCM decryption.
  //    - format: 'raw' because mk is a raw byte buffer.
  //    - algorithm: { name: 'AES-GCM' }
  //    - extractable: false to prevent key material from leaking.
  //    - keyUsages: ['decrypt'] so we can call subtle.decrypt().
  const key = await crypto.subtle.importKey(
    'raw',
    mk,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 4) Perform the AES-GCM decryption.
  //    - iv: the nonce extracted from the message
  //    - additionalData: the associated data (must match what was used in encryptAEAD)
  //    - ciphertext: the encrypted content + tag
  const ptBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: ad },
    key,
    ct
  );

  // 5) Wrap the decrypted ArrayBuffer in a Uint8Array for easier manipulation.
  return new Uint8Array(ptBuffer);
}
/**
 * HEADER:
 * Constructs a message header containing:
 *   • pn: 4-byte big-endian “previous chain length”
 *   • n:  4-byte big-endian “message number” in the current chain
 *   • dhPubRaw: the raw bytes of the sender’s current ECDH public key
 *
 * @param dhPair - Our current ECDH key pair; we extract and send dhPair.publicKey
 * @param pn     - Number of messages in the previous sending chain
 * @param n      - Sequence number of this message in the new sending chain
 * @returns       - A Uint8Array representing [pn||n||dhPubRaw]
 */
async function HEADER(
  dhPair: CryptoKeyPair,
  pn: number,
  n: number
): Promise<Uint8Array> {
  // 1) Export the public key as raw (uncompressed) bytes.
  //    On P-256 curves, this yields a 65-byte array: 0x04 || X (32 bytes) || Y (32 bytes).
  const pubRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', dhPair.publicKey)
  );

  // 2) Allocate a buffer: 8 bytes for pn+n, plus the length of the public key.
  const header = new Uint8Array(8 + pubRaw.length);

  // 3) Use a DataView to write the two 32-bit unsigned integers.
  const dv = new DataView(header.buffer);
  dv.setUint32(0, pn);  // bytes [0..3]
  dv.setUint32(4, n);   // bytes [4..7]

  // 4) Append the raw public key bytes starting at offset 8.
  header.set(pubRaw, 8);

  // 5) Return the complete header.
  return header;
}

/**
 * CONCAT:
 * Combines AAD (associated data) and header into a single Uint8Array,
 * to be used as the authenticated data input for AES-GCM.
 *
 * This avoids spread syntax for broad TS compatibility.
 *
 * @param ad     - Uint8Array of associated data (e.g., metadata, context)
 * @param header - Uint8Array containing the message header
 * @returns      - A new Uint8Array = [ ad || header ]
 */
function CONCAT(ad: Uint8Array, header: Uint8Array): Uint8Array {
  // 1) Allocate a buffer large enough to hold both `ad` and `header`.
  const out = new Uint8Array(ad.length + header.length);

  // 2) Copy the `ad` bytes into the beginning.
  out.set(ad, 0);

  // 3) Copy the `header` bytes immediately after `ad`.
  out.set(header, ad.length);

  // 4) Return the concatenated result.
  return out;
}

export interface EncryptedMessage {
  header: Uint8Array;
  ciphertext: Uint8Array;
}

export class DoubleRatchet {
  private dhs!: CryptoKeyPair;
  private dhr: CryptoKey | null = null;
  private rk!: ArrayBuffer;
  private cks: ArrayBuffer | null = null;
  private ckr: ArrayBuffer | null = null;
  private Ns = 0;
  private Nr = 0;
  private PN = 0;
  private skipped = new Map<string, ArrayBuffer>();

  /**
 * initAlice:
 *   Initialize Alice’s state after an X3DH handshake. This sets up the
 *   first Diffie–Hellman ratchet step and derives the initial root key and
 *   sending chain key.
 *
 * @param sharedSecret - The 32-byte SK output from X3DH, used as the initial root key.
 * @param bobPub       - Bob’s ECDH public key from X3DH, used for the first ratchet.
 */
async initAlice(sharedSecret: ArrayBuffer, bobPub: CryptoKey) {
  // 1) Generate our first ECDH ratchet key pair (DHs).
  this.dhs = await generateDH();

  // 2) Store Bob’s ratchet public key (DHR) for the upcoming DH calculation.
  this.dhr = bobPub;

  // 3) Compute the Diffie–Hellman output between our private key and Bob’s public key.
  const dhOut = await DH(this.dhs.privateKey, this.dhr);

  // 4) Feed that DH output into the root-KDF along with the shared secret:
  //    • rootKey – new root key (RK)
  //    • chainKey – initial sending chain key (CKs)
  const { rootKey, chainKey } = await KDF_RK(sharedSecret, dhOut);
  this.rk = rootKey;
  this.cks = chainKey;

  // 5) There’s no receiving chain key yet until Bob sends us a message.
  this.ckr = null;

  // 6) Reset all message counters:
  //    • Ns = number of messages we’ve sent on the current sending chain
  //    • Nr = number of messages we’ve received on the current receiving chain
  //    • PN = length of the *previous* sending chain (0 at start)
  this.Ns = this.Nr = this.PN = 0;

  // 7) Clear any stored out-of-order message keys from prior sessions.
  this.skipped.clear();
}
/**
 * encrypt:
 *   Perform a single symmetric-key ratchet step and AEAD-encrypt a message.
 *
 * @param plaintext      - The message bytes to encrypt.
 * @param associatedData - Optional additional data to authenticate (prepended).
 * @returns              - An object containing:
 *                         • header:   ratchet header bytes (PN || message number || our DH public key)
 *                         • ciphertext: AES-GCM output (IV || ciphertext || authTag)
 */
async encrypt(
  plaintext: Uint8Array,
  associatedData = new Uint8Array()
): Promise<EncryptedMessage> {
  // 1) Ensure the sending chain key (CKs) exists.
  if (!this.cks) throw new Error('Ratchet not initialized');

  // 2) Run the chain-KDF to get:
  //    • nextChainKey – for the following message
  //    • messageKey   – one-time key to encrypt this message
  const ckRes = await KDF_CK(this.cks);

  // 3) Update our sending chain key for future calls.
  this.cks = ckRes.chainKey;

  // 4) Extract the one-time message key.
  const mk = ckRes.messageKey;

  // 5) Build the header containing:
  //    • PN: previous chain length
  //    • Ns: current message index in this chain
  //    • DHs public key
  const header = await HEADER(this.dhs, this.PN, this.Ns);

  // 6) Increment our send counter for next time.
  this.Ns++;

  // 7) Combine any external associatedData with the header for AAD.
  const ad = CONCAT(associatedData, header);

  // 8) AEAD-encrypt the plaintext under the message key and AAD.
  const ciphertext = await encryptAEAD(mk, plaintext, ad);

  // 9) Return both header and ciphertext so the recipient can decrypt correctly.
  return { header, ciphertext };
}

  /** Symmetric-key ratchet decrypt */
  async decrypt(
    header: Uint8Array,
    ciphertext: Uint8Array,
    associatedData = new Uint8Array()
  ): Promise<Uint8Array> {
    // parse header
    const dv = new DataView(header.buffer);
    const pn = dv.getUint32(0);
    const n = dv.getUint32(4);
    const pubRaw = header.slice(8);
    const dhPub = await crypto.subtle.importKey(
      'raw',
      pubRaw,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );

    // DH ratchet if new DH public key
    /** simple Uint8Array equality check */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  
  // … inside your decrypt() method:
  
  // export the old remote public key
  const oldRaw = this.dhr
    ? new Uint8Array(await crypto.subtle.exportKey('raw', this.dhr))
    : null;
  
  // DH ratchet if no previous key or keys differ
  if (!oldRaw || !bytesEqual(pubRaw, oldRaw)) {
    // store skipped keys from old chain
    if (this.ckr) await this.skipTo(pn);
  
    // perform DH ratchet
    this.PN = this.Ns;
    this.Ns = this.Nr = 0;
    this.dhr = dhPub;
  
    // first half-step
    const dhOut1 = await DH(this.dhs.privateKey, this.dhr);
    ({ rootKey: this.rk, chainKey: this.ckr } = await KDF_RK(this.rk, dhOut1));
  
    // rotate our key pair
    this.dhs = await generateDH();
  
    // second half-step
    const dhOut2 = await DH(this.dhs.privateKey, this.dhr);
    ({ rootKey: this.rk, chainKey: this.cks } = await KDF_RK(this.rk, dhOut2));
  }
  

    // skip to message n
    if (!this.ckr) throw new Error('Receive chain not initialized');
    await this.skipTo(n);

    // derive message key
    const ckRes = await KDF_CK(this.ckr);
    this.ckr = ckRes.chainKey;
    const mk = ckRes.messageKey;
    this.Nr++;

    // decrypt
    const ad = CONCAT(associatedData, header);
    return decryptAEAD(mk, ciphertext, ad);
  }

  /** store skipped‐over message keys up to `until` */
  private async skipTo(until: number) {
    if (this.Nr + MAX_SKIP < until) throw new Error('Too many skipped messages');
    while (this.Nr < until) {
      const ckRes = await KDF_CK(this.ckr!);
      this.ckr = ckRes.chainKey;
      this.skipped.set(`${this.PN}|${this.Nr}`, ckRes.messageKey);
      this.Nr++;
    }
  }

  /** Convenience for text */
  async encryptText(s: string): Promise<EncryptedMessage> {
    return this.encrypt(encoder.encode(s));
  }
  async decryptText(msg: EncryptedMessage): Promise<string> {
    const pt = await this.decrypt(msg.header, msg.ciphertext);
    return decoder.decode(pt);
  }
  /** Files/voice are just ArrayBuffers under the hood */
  async encryptData(buf: ArrayBuffer): Promise<EncryptedMessage> {
    return this.encrypt(new Uint8Array(buf));
  }
  async decryptData(msg: EncryptedMessage): Promise<ArrayBuffer> {
    // decrypt() gives you a Uint8Array
    const decrypted = await this.decrypt(msg.header, msg.ciphertext);
  
    // allocate a new ArrayBuffer of exactly the right length
    const out = new ArrayBuffer(decrypted.byteLength);
  
    // copy the decrypted bytes into it
    new Uint8Array(out).set(decrypted);
  
    return out;
  }
  
  
}

// ==== REACT COMPONENT ====

export interface SecureMessageProps {
  ratchet: DoubleRatchet;
  onSend?: (msg: EncryptedMessage) => void;
  incomingMessage?: EncryptedMessage;
}

const SecureMessage: FC<SecureMessageProps> = ({ ratchet, onSend, incomingMessage }) => {
  const [text, setText] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // decrypt any incoming text automatically
  useEffect(() => {
    if (incomingMessage) {
      ratchet.decryptText(incomingMessage)
        .then(setDecryptedText)
        .catch(console.error);
    }
  }, [incomingMessage, ratchet]);

  /** send a text message */
  const sendText = async () => {
    const msg = await ratchet.encryptText(text);
    onSend?.(msg);
    setText('');
  };

  /** send a file (images, documents, or voice blobs) */
  const sendFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const msg = await ratchet.encryptData(buf);
    onSend?.(msg);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg shadow-sm">
      <div>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your message…"
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={sendText}
        >
          Send Text
        </button>
      </div>

      <div>
        <input
          ref={fileRef}
          type="file"
          onChange={e => e.target.files && sendFile(e.target.files[0])}
        />
      </div>

      {decryptedText !== null && (
        <div className="p-2 bg-gray-100 rounded">
          <strong>Decrypted:</strong> {decryptedText}
        </div>
      )}
    </div>
  );
};

export default SecureMessage;

/** Next.js dynamic export (no SSR) */
export const DynamicSecureMessage = dynamic(
  () => Promise.resolve(SecureMessage),
  { ssr: false }
);
