import nacl from 'tweetnacl';
import { HKDF } from '@stablelib/hkdf';
import { SHA256 } from '@stablelib/sha256';

export class DoubleRatchet {
  private rk: Uint8Array;
  private cks: Uint8Array;
  private ckr: Uint8Array | null;
  private dhs: nacl.BoxKeyPair;
  private dhr: Uint8Array;
  private Ns = 0;
  private Nr = 0;
  private PN = 0;

  constructor(sharedSecret: Uint8Array, ratchetPub: Uint8Array) {
    // Root KDF → rk (root key) and cks (sending chain key)
    const info = new TextEncoder().encode('DoubleRatchetRK');
    const hkdf = new HKDF(SHA256, sharedSecret, sharedSecret, info);
    const out = hkdf.expand(64);
    this.rk = out.slice(0, 32);
    this.cks = out.slice(32, 64);

    // No receiving chain yet
    this.ckr = null;

    // DH keypair for sending
    this.dhs = nacl.box.keyPair();
    this.dhr = ratchetPub;
  }

  private ratchetCK(chainKey: Uint8Array) {
    const info = new TextEncoder().encode('DoubleRatchetCK');
    const hkdf = new HKDF(SHA256, chainKey, chainKey, info);
    const out = hkdf.expand(64);
    return { chainKey: out.slice(0, 32), messageKey: out.slice(32, 64) };
  }

  async dhRatchet(incomingPub: Uint8Array) {
    this.PN = this.Ns;
    this.Ns = 0;
    this.Nr = 0;
    this.dhr = incomingPub;

    // DH1: update root & sending chain
    const dh1 = nacl.scalarMult(this.dhs.secretKey, this.dhr);
    const hkdf1 = new HKDF(SHA256, dh1, this.rk, new TextEncoder().encode('DoubleRatchetRK1'));
    let out1 = hkdf1.expand(64);
    this.rk = out1.slice(0, 32);
    this.cks = out1.slice(32, 64);

    // Rotate DH keypair and derive receiving chain
    this.dhs = nacl.box.keyPair();
    const dh2 = nacl.scalarMult(this.dhs.secretKey, this.dhr);
    const hkdf2 = new HKDF(SHA256, dh2, this.rk, new TextEncoder().encode('DoubleRatchetRK2'));
    let out2 = hkdf2.expand(64);
    this.rk = out2.slice(0, 32);
    this.ckr = out2.slice(32, 64);
  }

  encrypt(plaintext: Uint8Array): Uint8Array {
    // Symmetric ratchet on sending chain
    const { chainKey, messageKey } = this.ratchetCK(this.cks);
    this.cks = chainKey;
    this.Ns++;

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const cipher = nacl.secretbox(plaintext, nonce, messageKey);

    return new Uint8Array([
      ...this.dhs.publicKey,
      this.Ns,
      this.PN,
      ...nonce,
      ...cipher,
    ]);
  }

  async decrypt(payload: Uint8Array): Promise<Uint8Array> {
    // Get the length of the public key (typically 32 bytes)
    const pkLen = nacl.box.publicKeyLength;
  
    // Extract the sender's ephemeral public key from the payload
    const dhPub = payload.slice(0, pkLen);
  
    // Calculate the start index for the nonce after skipping pubkey and two extra bytes (e.g., version/flag)
    const nonceStart = pkLen + 2;
  
    // Extract the nonce used for this message (24 bytes for NaCl secretbox)
    const nonce = payload.slice(nonceStart, nonceStart + nacl.secretbox.nonceLength);
  
    // Extract the actual encrypted message (ciphertext)
    const cipher = payload.slice(nonceStart + nacl.secretbox.nonceLength);
  
    let messageKey: Uint8Array;
  
    if (this.ckr === null) {
      // If no receiving chain key, this must be the FIRST message received.
      // Use the sending chain key instead (because both sides start symmetrical)
      
      const { chainKey, messageKey: mk } = this.ratchetCK(this.cks); // Derive next chain & message keys
      this.cks = chainKey;   // Update sending chain key
      this.Nr++;             // Increment receiving message counter
      messageKey = mk;       // Use derived message key
    } else {
      // For subsequent messages:
      // Step 1: Check if we need to perform a DH ratchet (new sender public key)
      if (!arraysEqual(dhPub, this.dhr)) {
        await this.dhRatchet(dhPub);  // Perform DH ratchet and update receiving chain key
      }
  
      // After DH ratchet, receiving chain key should exist
      if (!this.ckr) {
        console.warn('⚠️ No receiving chain—returning empty');
        return new Uint8Array(); // Return empty if chain key is missing
      }
  
      // Step 2: Derive next message key from receiving chain key
      const { chainKey, messageKey: mk } = this.ratchetCK(this.ckr);
      this.ckr = chainKey;   // Update receiving chain key
      this.Nr++;             // Increment receiving message counter
      messageKey = mk;       // Use derived message key
    }
  
    // Attempt to decrypt the ciphertext using NaCl secretbox
    const plain = nacl.secretbox.open(cipher, nonce, messageKey);
  
    if (!plain) {
      console.warn('⚠️ Decryption failed—returning empty');
      return new Uint8Array(); // Return empty array on failure
    }
  
    // Successfully decrypted — return plaintext
    return plain;
  }
  
}

// Helper to compare Uint8Arrays
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
