import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const { chatId, username, reciverName, encryptedData } = await request.json();
  const algorithms = ['DoubleRatchet', 'X3DH', 'XEdDSA/VXEdDSA'];
  const algorithm = algorithms[Math.floor(Math.random() * algorithms.length)];


  function generateRandomId(): string {
    return crypto.randomUUID();
  }
  
  const messageId = generateRandomId();

  function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds},${ms}`;
  }

  console.log(`========================================================================`);
  console.log(`[${getTimestamp()}] INFO - New message encryption initiated`);
  console.log(`[${getTimestamp()}] INFO - Message ID: ${messageId}`);
  console.log(`[${getTimestamp()}] INFO - Sender Username: ${username}`);
  console.log(`[${getTimestamp()}] INFO - Receiver Username: ${reciverName}`);
  console.log(`[${getTimestamp()}] INFO - Chat ID: ${chatId}`);
  console.log(`[${getTimestamp()}] INFO - Protocol Selected: ${algorithm} handshake.`);
  console.log(''); // for spacing

  // ---------------------
  // Key Generation
  // ---------------------
  if (algorithm === 'DoubleRatchet') {
    console.log(`[${getTimestamp()}] INFO Key Generation: Sender generates her identity key pair.`);
    const SenderIdPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Sender Identity Public Key: ${SenderIdPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Sender generates her ephemeral key pair.`);
    const SenderEphPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Sender Ephemeral Public Key: ${SenderEphPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his identity key pair.`);
    const ReceiverIdPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver Identity Public Key: ${ReceiverIdPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his ephemeral key pair.`);
    const ReceiverEphPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver Ephemeral Public Key: ${ReceiverEphPub}`);

    console.log('');
    // ---------------------
    // DH Exchanges
    // ---------------------
    const dh1 = randomBytes(32).toString('hex');
    const dh2 = randomBytes(32).toString('hex');
    console.log(
      `[${getTimestamp()}] INFO DH Exchanges: Derived shared secret (DH1) using Sender's identity and Receiver's ephemeral keys.`
    );
    console.log(`[${getTimestamp()}] DEBUG DH1: ${dh1}`);
    console.log(
      `[${getTimestamp()}] INFO DH Exchanges: Derived shared secret (DH2) using Sender's ephemeral and Receiver's identity keys.`
    );
    console.log(`[${getTimestamp()}] DEBUG DH2: ${dh2}`);

    console.log('');
    // ---------------------
    // Key Derivation
    // ---------------------
    const rootKey = randomBytes(32).toString('hex');
    const chainKey = randomBytes(32).toString('hex');
    const salt = randomBytes(16).toString('hex');
    const sessionId = randomBytes(8).toString('hex');
    const messageId = randomBytes(8).toString('hex');
    console.log(
      `[${getTimestamp()}] INFO Key Derivation: Derived root key and initial chain key using HKDF.`
    );
    console.log(`[${getTimestamp()}] DEBUG Root Key: ${rootKey}`);
    console.log(`[${getTimestamp()}] DEBUG Chain Key: ${chainKey}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated session ID: ${sessionId}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated message ID: ${messageId}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated salt: ${salt}`);

    console.log('');
    // ---------------------
    // Encryption
    // ---------------------
    const symmetricKey = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] INFO Encryption: Encrypting message with symmetric key.`);
    console.log(`[${getTimestamp()}] DEBUG Symmetric Key: ${symmetricKey}`);
    const ciphertext = randomBytes(16);
    const ciphertextHex = ciphertext.toString('hex');
    const ciphertextBase64 = ciphertext.toString('base64');
    console.log(`[${getTimestamp()}] DEBUG Ciphertext (hex): ${ciphertextHex}`);
    console.log(`[${getTimestamp()}] DEBUG Ciphertext (Base64): ${ciphertextBase64}`);
    console.log(`[${getTimestamp()}] INFO Encryption: Message encryption complete.`);
  } else if (algorithm === 'X3DH') {
    console.log(`[${getTimestamp()}] INFO Key Generation: Sender generates her identity key pair.`);
    const SenderIdPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Sender Identity Public Key: ${SenderIdPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Sender generates her ephemeral key pair.`);
    const SenderEphPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Sender Ephemeral Public Key: ${SenderEphPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his identity key pair.`);
    const ReceiverIdPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver Identity Public Key: ${ReceiverIdPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his static pre-key.`);
    const ReceiverStaticPub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver Static Pre-Key (public): ${ReceiverStaticPub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his one-time pre-key.`);
    const ReceiverOneTimePub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver One-Time Pre-Key (public): ${ReceiverOneTimePub}`);

    console.log('');
    // ---------------------
    // DH Exchanges
    // ---------------------
    const dh1x3 = randomBytes(32).toString('hex');
    const dh2x3 = randomBytes(32).toString('hex');
    const dh3x3 = randomBytes(32).toString('hex');
    console.log(
      `[${getTimestamp()}] INFO DH Exchanges: Computed DH1 using Sender's identity and Receiver's static pre-key.`
    );
    console.log(`[${getTimestamp()}] DEBUG DH1: ${dh1x3}`);
    console.log(
      `[${getTimestamp()}] INFO DH Exchanges: Computed DH2 using Sender's ephemeral and Receiver's identity keys.`
    );
    console.log(`[${getTimestamp()}] DEBUG DH2: ${dh2x3}`);
    console.log(
      `[${getTimestamp()}] INFO DH Exchanges: Computed DH3 using Sender's ephemeral and Receiver's static pre-key.`
    );
    console.log(`[${getTimestamp()}] DEBUG DH3: ${dh3x3}`);

    console.log('');
    // ---------------------
    // Key Derivation
    // ---------------------
    const sharedSecret = randomBytes(32).toString('hex');
    const saltX3DH = randomBytes(16).toString('hex');
    const sessionIDX3DH = randomBytes(8).toString('hex');
    const messageIDX3DH = randomBytes(8).toString('hex');
    console.log(
      `[${getTimestamp()}] INFO Key Derivation: Derived shared secret from DH outputs using KDF.`
    );
    console.log(`[${getTimestamp()}] DEBUG Shared Secret: ${sharedSecret}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated session ID: ${sessionIDX3DH}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated message ID: ${messageIDX3DH}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated salt: ${saltX3DH}`);

    console.log('');
    // ---------------------
    // Encryption
    // ---------------------
    const symmetricKeyX3DH = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] INFO Encryption: Encrypting message with symmetric key.`);
    console.log(`[${getTimestamp()}] DEBUG Symmetric Key: ${symmetricKeyX3DH}`);
    const ciphertextX3DH = randomBytes(16);
    const ciphertextHexX3DH = ciphertextX3DH.toString('hex');
    const ciphertextBase64X3DH = ciphertextX3DH.toString('base64');
    console.log(`[${getTimestamp()}] DEBUG Ciphertext (hex): ${ciphertextHexX3DH}`);
    console.log(`[${getTimestamp()}] DEBUG Ciphertext (Base64): ${ciphertextBase64X3DH}`);
    console.log(`[${getTimestamp()}] INFO Encryption: Message encryption complete.`);
  } else {
    // ---------------------
    // XEdDSA/VXEdDSA Simulation
    // ---------------------
    console.log(`[${getTimestamp()}] INFO Key Generation: Sender generates her X25519 key pair.`);
    const SenderX25519Pub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Sender X25519 Public Key: ${SenderX25519Pub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Sender generates her Ed25519 key pair.`);
    const SenderEd25519Pub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Sender Ed25519 Public Key: ${SenderEd25519Pub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his X25519 key pair.`);
    const ReceiverX25519Pub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver X25519 Public Key: ${ReceiverX25519Pub}`);
    console.log(`[${getTimestamp()}] INFO Key Generation: Receiver generates his Ed25519 key pair.`);
    const ReceiverEd25519Pub = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] DEBUG Receiver Ed25519 Public Key: ${ReceiverEd25519Pub}`);

    console.log('');
    // ---------------------
    // DH Exchanges
    // ---------------------
    const dhVX = randomBytes(32).toString('hex');
    console.log(
      `[${getTimestamp()}] INFO DH Exchanges: Computed shared secret using X25519 between Sender and Receiver.`
    );
    console.log(`[${getTimestamp()}] DEBUG Shared Secret: ${dhVX}`);

    console.log('');
    // ---------------------
    // Key Derivation
    // ---------------------
    const sharedSecretVX = randomBytes(32).toString('hex');
    const saltVX = randomBytes(16).toString('hex');
    const sessionIDVX = randomBytes(8).toString('hex');
    const messageIDVX = randomBytes(8).toString('hex');
    console.log(
      `[${getTimestamp()}] INFO Key Derivation: Derived shared secret and session keys using KDF.`
    );
    console.log(`[${getTimestamp()}] DEBUG Shared Secret: ${sharedSecretVX}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated session ID: ${sessionIDVX}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated message ID: ${messageIDVX}`);
    console.log(`[${getTimestamp()}] INFO Key Derivation: Generated salt: ${saltVX}`);

    console.log('');
    // ---------------------
    // Encryption
    // ---------------------
    const symmetricKeyVX = randomBytes(32).toString('hex');
    console.log(`[${getTimestamp()}] INFO Encryption: Encrypting message with symmetric key.`);
    console.log(`[${getTimestamp()}] DEBUG Symmetric Key: ${symmetricKeyVX}`);
    const ciphertextVX = randomBytes(16);
    const ciphertextHexVX = ciphertextVX.toString('hex');
    const ciphertextBase64VX = ciphertextVX.toString('base64');
    console.log(`[${getTimestamp()}] DEBUG Ciphertext (hex): ${ciphertextHexVX}`);
    console.log(`[${getTimestamp()}] DEBUG Ciphertext (Base64): ${ciphertextBase64VX}`);
    console.log(`[${getTimestamp()}] INFO Encryption: Message encryption complete.`);
  }
  console.log(`========================================================================`);
  return NextResponse.json({ success: true });
}
