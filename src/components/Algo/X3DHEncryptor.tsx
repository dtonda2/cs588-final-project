import React, { FC, useState, useEffect } from 'react';
import nacl from 'tweetnacl';
import { HKDF } from '@stablelib/hkdf';
import { SHA256 } from '@stablelib/sha256';
import { useSignatureVRF } from './XEdDSA-and-VXEdDSA';

interface PeerBundle {
  edPub: Uint8Array;            // Ed25519 identity pub
  dhPub: Uint8Array;            // X25519 identity pub
  spPub: Uint8Array;            // X25519 signed-pre-key pub
  spSig: string;                // SPK sig (Base64) over spPub by edPriv
  otpPub?: Uint8Array;          // optional one-time pre-key
  ephKeypair?: nacl.BoxKeyPair; // optional ephemeral keypair
}

interface RemoteBundle {
  edPub: Uint8Array;
  dhPub: Uint8Array;
  spPub: Uint8Array;
  spSig: string;
  otpPub?: Uint8Array;
  ephPub: Uint8Array;
}

export class X3DHSession {
  private edPair = nacl.sign.keyPair();     // Ed25519 for signing/verifying SPKs
  private dhPair = nacl.box.keyPair();      // X25519 identity key
  private spPair = nacl.box.keyPair();      // X25519 signed pre-key
  private otpPairs = Array.from({ length: 5 }, () => nacl.box.keyPair());
  private sessionKey: Uint8Array | null = null;
  private verifyMessage: (m: Uint8Array, sig: string, pk: Uint8Array) => boolean;

  constructor(verifyFn: typeof useSignatureVRF.prototype.verifyMessage) {
    this.verifyMessage = verifyFn;
  }

  deriveSession(bundle: PeerBundle) {
    console.log('→ Alice deriveSession inputs:', {
      edPub: Buffer.from(bundle.edPub).toString('hex'),
      dhPub: Buffer.from(bundle.dhPub).toString('hex'),
      spPub: Buffer.from(bundle.spPub).toString('hex'),
      spSig: bundle.spSig,
    });

    // 1) Verify SPK signature with Ed25519
    if (!this.verifyMessage(bundle.spPub, bundle.spSig, bundle.edPub)) {
      throw new Error('Invalid SPK signature');
    }

    // 2) Pick/reuse ephemeral
    const eph = bundle.ephKeypair || nacl.box.keyPair();

    // 3) Four DHs per Signal spec
    const dh1 = nacl.scalarMult(this.dhPair.secretKey, bundle.spPub);      // IKa ↔ SPKb
    const dh2 = nacl.scalarMult(eph.secretKey, bundle.dhPub);              // EKa ↔ IKb
    const dh3 = nacl.scalarMult(eph.secretKey, bundle.spPub);              // EKa ↔ SPKb
    const dh4 = bundle.otpPub
      ? nacl.scalarMult(eph.secretKey, bundle.otpPub)                     // EKa ↔ OT PKb
      : new Uint8Array(32);

    // 4) Concat into IKM
    const ikm = new Uint8Array(128);
    ikm.set(dh1,   0);
    ikm.set(dh2,  32);
    ikm.set(dh3,  64);
    ikm.set(dh4,  96);

    // 5) HKDF-SHA256(ikm, 32-byte salt, info="X3DH-Session") → 32-byte SK
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('X3DH-Session');
    const hkdf = new HKDF(SHA256, ikm, salt, info);
    this.sessionKey = hkdf.expand(32);
  }

  deriveSessionFromRemote(remote: RemoteBundle) {
    console.log('→ Bob deriveSessionFromRemote inputs:', {
      edPub: Buffer.from(remote.edPub).toString('hex'),
      dhPub: Buffer.from(remote.dhPub).toString('hex'),
      spPub: Buffer.from(remote.spPub).toString('hex'),
      spSig: remote.spSig,
      ephPub: Buffer.from(remote.ephPub).toString('hex'),
    });

    if (!this.verifyMessage(remote.spPub, remote.spSig, remote.edPub)) {
      throw new Error('Invalid SPK signature');
    }

    const dh1 = nacl.scalarMult(this.spPair.secretKey, remote.dhPub);     // SPKa ↔ IKb
    const dh2 = nacl.scalarMult(this.dhPair.secretKey, remote.ephPub);   // IKa ↔ EPKb
    const dh3 = nacl.scalarMult(this.spPair.secretKey, remote.ephPub);   // SPKa ↔ EPKb
    const dh4 = remote.otpPub
      ? nacl.scalarMult(this.otpPairs[0].secretKey, remote.ephPub)      // OTPKa ↔ EPKb
      : new Uint8Array(32);

    const ikm = new Uint8Array(128);
    ikm.set(dh1,   0);
    ikm.set(dh2,  32);
    ikm.set(dh3,  64);
    ikm.set(dh4,  96);

    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('X3DH-Session');
    const hkdf = new HKDF(SHA256, ikm, salt, info);
    this.sessionKey = hkdf.expand(32);
  }

  getSessionKey(): Uint8Array {
    if (!this.sessionKey) throw new Error('Session not derived');
    return this.sessionKey;
  }

  getEd25519Keypair(): nacl.SignKeyPair {
    return this.edPair;
  }
  getX25519Keypair(): nacl.BoxKeyPair {
    return this.dhPair;
  }
  getSPublicKey(): Uint8Array {
    return this.spPair.publicKey;
  }
}

const X3DHEncryptor: FC = () => {
  const { verifyMessage } = useSignatureVRF();
  const [bundle, setBundle] = useState<PeerBundle | null>(null);
  const [x3dh] = useState(() => new X3DHSession(verifyMessage));
  useEffect(() => {
    if (bundle) x3dh.deriveSession(bundle);
  }, [bundle, x3dh]);
  return null;
};

export default X3DHEncryptor;
