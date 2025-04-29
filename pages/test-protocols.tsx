import { useEffect } from 'react';
import nacl from 'tweetnacl';
import { useSignatureVRF } from '../src/components/Algo/XEdDSA-and-VXEdDSA';
import { X3DHSession } from '../src/components/Algo/X3DHEncryptor';
import { DoubleRatchet } from '../src/components/Algo/DoubleRatchetAlgo';

export default function ProtocolTestPage() {
  const { generateIdentityKeypair, signMessage, verifyMessage } = useSignatureVRF();

  useEffect(() => {
    // 1) Ed25519 self-test
    const idTest = generateIdentityKeypair();
    const hello = new TextEncoder().encode('Hello Signal!');
    console.log(
      'Ed25519 valid?',
      verifyMessage(hello, signMessage(hello, idTest.secretKey), idTest.publicKey)
    );

    // 2) Spin up Alice & Bob X3DH sessions
    const aliceX = new X3DHSession(verifyMessage);
    const bobX   = new X3DHSession(verifyMessage);

    // Grab both identity keypairs
    const aliceEd = aliceX.getEd25519Keypair();
    const aliceDh = aliceX.getX25519Keypair();
    const bobEd   = bobX.getEd25519Keypair();
    const bobDh   = bobX.getX25519Keypair();

    // Generate signed pre-keys + signatures
    const aliceSP = aliceX.getSPublicKey();
    const aliceSpSig = signMessage(aliceSP, aliceEd.secretKey);

    const bobSP = bobX.getSPublicKey();
    const bobSpSig = signMessage(bobSP, bobEd.secretKey);

    // Create Alice’s ephemeral
    const aliceEph = nacl.box.keyPair();

    // 🔑 BUILD “BobBundle” for Alice — include Alice’s ephKeypair
    const bobBundle = {
      edPub: bobEd.publicKey,
      dhPub: bobDh.publicKey,
      spPub: bobSP,
      spSig: bobSpSig,
      otpPub: undefined,
      ephKeypair: aliceEph,       // ← THIS IS THE CRUCIAL FIX
    };

    // Alice derives the session
    aliceX.deriveSession(bobBundle);

    // 🔑 BUILD “AliceBundle” for Bob
    const aliceBundle = {
      edPub: aliceEd.publicKey,
      dhPub: aliceDh.publicKey,
      spPub: aliceSP,
      spSig: aliceSpSig,
      otpPub: undefined,
      ephPub: aliceEph.publicKey,
    };

    // Bob derives the same session
    bobX.deriveSessionFromRemote(aliceBundle);

    // SKs should now match
    const aSK = aliceX.getSessionKey();
    const bSK = bobX.getSessionKey();
    console.log('Alice SK (hex):', Buffer.from(aSK).toString('hex'));
    console.log('Bob   SK (hex):', Buffer.from(bSK).toString('hex'));

    // 3) Double Ratchet round-trip
    const drA = new DoubleRatchet(aSK, aliceEph.publicKey);
    const drB = new DoubleRatchet(bSK, aliceEph.publicKey);

    const ciphertext = drA.encrypt(new TextEncoder().encode('Secret message'));
    drB.decrypt(ciphertext)
      .then(pt => console.log('DoubleRatchet output:', new TextDecoder().decode(pt)))
      .catch(err => console.warn('DR decrypt error:', err));
  }, [generateIdentityKeypair, signMessage, verifyMessage]);

  return (
    <main style={{ padding: 20 }}>
      <h1>Protocol Tests</h1>
      <p>Open your browser console for results.</p>
    </main>
  );
}
