import { useState } from 'react';

// Generate an Ed25519 key pair using Web Crypto API
const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey('spki', keyPair.publicKey)))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)))),
    keyPair,
  };
};

// Sign a message using the private key
const signMessage = async (message, privateKeyBase64) => {
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0)).buffer;
  const privateKey = await window.crypto.subtle.importKey('pkcs8', privateKeyBuffer, { name: 'Ed25519', namedCurve: 'Ed25519' }, false, ['sign']);

  const signature = await window.crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(message));

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

// Verify a signature using the public key
const verifySignature = async (message, signatureBase64, publicKeyBase64) => {
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)).buffer;
  const publicKey = await window.crypto.subtle.importKey('spki', publicKeyBuffer, { name: 'Ed25519', namedCurve: 'Ed25519' }, false, ['verify']);

  const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0)).buffer;

  return await window.crypto.subtle.verify('Ed25519', publicKey, signature, new TextEncoder().encode(message));
};

// Component to handle signing multiple messages dynamically
export const SignComponent = ({ onSign, onKeyPair }) => {
  const [message, setMessage] = useState('');
  const [signedMessages, setSignedMessages] = useState([]);
  const [keys, setKeys] = useState(null);

  // Generate keys when component loads
  const handleGenerateKeys = async () => {
    const generatedKeys = await generateKeyPair();
    setKeys(generatedKeys);
    onKeyPair && onKeyPair(generatedKeys.publicKey);
  };

  // Sign a new message and store it
  const handleSign = async () => {
    if (!keys) {
      alert('Generating a key pair first...');
      await handleGenerateKeys();
    }

    const signature = await signMessage(message, keys.privateKey);
    const newEntry = { message, signature };
    setSignedMessages([...signedMessages, newEntry]);
    setMessage(''); // Clear input after signing
    onSign && onSign(newEntry);
  };

  return (
    <div>
      <h2>Sign Messages Dynamically</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter a message to sign"
        style={{ width: '100%', height: '80px' }}
      />
      <button onClick={handleSign}>Sign Message</button>
      {keys && (
        <p>
          <strong>Public Key:</strong> <code>{keys.publicKey}</code>
        </p>
      )}
      <h3>Signed Messages:</h3>
      <ul>
        {signedMessages.map((entry, index) => (
          <li key={index}>
            <strong>Message:</strong> {entry.message} <br />
            <strong>Signature:</strong> {entry.signature}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component to verify multiple messages dynamically
export const VerifyComponent = ({ signedMessages, publicKey }) => {
  const [verificationResults, setVerificationResults] = useState({});

  const handleVerify = async (message, signature) => {
    try {
      const isValid = await verifySignature(message, signature, publicKey);
      setVerificationResults(prev => ({ ...prev, [message]: isValid }));
    } catch (error) {
      setVerificationResults(prev => ({ ...prev, [message]: false }));
    }
  };

  return (
    <div>
      <h2>Verify Signed Messages</h2>
      {signedMessages.length === 0 ? (
        <p>No signed messages yet.</p>
      ) : (
        <ul>
          {signedMessages.map((entry, index) => (
            <li key={index}>
              <strong>Message:</strong> {entry.message} <br />
              <strong>Signature:</strong> {entry.signature} <br />
              <button onClick={() => handleVerify(entry.message, entry.signature)}>Verify</button>
              {verificationResults[entry.message] !== undefined && (
                <p>
                  Signature is{' '}
                  {verificationResults[entry.message] ? (
                    <span style={{ color: 'green' }}>VALID</span>
                  ) : (
                    <span style={{ color: 'red' }}>INVALID</span>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
