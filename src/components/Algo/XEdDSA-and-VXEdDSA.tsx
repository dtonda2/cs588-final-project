// File: src/components/Algo/XEdDSA-and-VXEdDSA.tsx
import { useState, useEffect, useCallback } from 'react';
import sodium from 'libsodium-wrappers-sumo';

/**
 * Hook that provides:
 *  - XEdDSA: Ed25519-based signing/verification with 
 *           built-in conversion to Curve25519 for X3DH
 *  - VXEdDSA: VRF prove/verify
 */
export function useSignatureVRF() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    sodium.ready.then(() => setReady(true));
  }, []);

  /** Ed25519 identity keypair */
  const generateIdentityKeypair = useCallback(() => {
    const seed = sodium.randombytes_buf(sodium.crypto_sign_SEEDBYTES);
    const { publicKey, privateKey } = sodium.crypto_sign_seed_keypair(seed);
    return { publicKey, secretKey: privateKey };
  }, []);

  /**
   * XEdDSA signing: Ed25519-detached, base64‐encoded
   */
  const signMessage = useCallback(
    (msg: Uint8Array, secretKey: Uint8Array): string => {
      const sig = sodium.crypto_sign_detached(msg, secretKey);
      return sodium.to_base64(sig, sodium.base64_variants.ORIGINAL);
    },
    []
  );

  /**
   * XEdDSA verify
   */
  const verifyMessage = useCallback(
    (msg: Uint8Array, signature: string, publicKey: Uint8Array): boolean => {
      const sig = sodium.from_base64(signature, sodium.base64_variants.ORIGINAL);
      return sodium.crypto_sign_verify_detached(sig, msg, publicKey);
    },
    []
  );

  /** VXEdDSA (VRF) keypair */
  const generateVRFKeypair = useCallback(() => {
    const { publicKey, privateKey } = sodium.crypto_vrf_keypair();
    return { publicKey, secretKey: privateKey };
  }, []);

  /**
   * VXEdDSA prove → base64 proof
   */
  const proveVRF = useCallback(
    (msg: Uint8Array, secretKey: Uint8Array): string => {
      const proof = sodium.crypto_vrf_prove(secretKey, msg);
      return sodium.to_base64(proof, sodium.base64_variants.ORIGINAL);
    },
    []
  );

  /**
   * VXEdDSA verify proof
   */
  const verifyVRF = useCallback(
    (proofB64: string, publicKey: Uint8Array, msg: Uint8Array): boolean => {
      const proof = sodium.from_base64(proofB64, sodium.base64_variants.ORIGINAL);
      try {
        sodium.crypto_vrf_verify(publicKey, proof, msg);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  /** 
   * Convert VRF proof → uniform hash output 
   * (32 bytes)
   */
  const proofToHash = useCallback(
    (proofB64: string): Uint8Array => {
      const proof = sodium.from_base64(proofB64, sodium.base64_variants.ORIGINAL);
      return sodium.crypto_vrf_proof_to_hash(proof);
    },
    []
  );

  return {
    ready,
    generateIdentityKeypair,
    signMessage,
    verifyMessage,
    generateVRFKeypair,
    proveVRF,
    verifyVRF,
    proofToHash,
  };
}
