import { useCallback } from 'react';

/*
  Advanced XEdDSA-Inspired Encryption/Decryption Logic Hook
  ----------------------------------------------------------
  This hook provides functions to encrypt and decrypt:
    • Plaintext (strings)
    • Binary data (ArrayBuffers), used for files or voice notes
  
  It uses a reversible XOR cipher with a text-based key. The key is converted to a
  Uint8Array and used to XOR each byte of the input data. For text, the result is encoded
  or decoded to/from Base64 (to keep encrypted text displayable), while for binary data
  (e.g., files) the encryption/decryption functions operate on ArrayBuffers. File/voice note
  processing is asynchronous using FileReader.
  
*/

// Text conversion helpers using browser APIs.
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Convert a string to a Uint8Array.
const stringToUint8Array = (str: string | undefined) => textEncoder.encode(str);

// Convert a Uint8Array to a string.
const uint8ArrayToString = (uint8array: AllowSharedBufferSource | Uint8Array<any> | undefined) => textDecoder.decode(uint8array);

// Convert a Uint8Array to a Base64 string.
const uint8ArrayToBase64 = (uint8array: any[] | Uint8Array<any>) => {
  // Convert Uint8Array to binary string.
  let binary = '';
  uint8array.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
};

// Convert a Base64 string to a Uint8Array.
const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const uint8array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8array[i] = binary.charCodeAt(i);
  }
  return uint8array;
};

// A simple XOR cipher that works on Uint8Array data.
// It applies the key repeatedly to every byte in the data.
const xorEncryptData = (dataUint8: string | any[] | Uint8Array<any>, keyUint8: string | any[] | Uint8Array<ArrayBufferLike>) => {
  const output = new Uint8Array(dataUint8.length);
  for (let i = 0; i < dataUint8.length; i++) {
    // Cycle through key bytes using modulo arithmetic.
    output[i] = dataUint8[i] ^ keyUint8[i % keyUint8.length];
  }
  return output;
};

/*
  useEncryptDecrypt Hook
  ----------------------
  Exposes the following functions:
    • encryptText(plaintext: string, key: string): string  
          Encrypts text and returns a Base64-encoded ciphertext.
    • decryptText(ciphertext: string, key: string): string  
          Decrypts a Base64-encoded ciphertext back to plaintext.
    • encryptArrayBuffer(buffer: ArrayBuffer, key: string): ArrayBuffer  
          Encrypts binary data and returns an ArrayBuffer.
    • decryptArrayBuffer(buffer: ArrayBuffer, key: string): ArrayBuffer  
          Decrypts binary data (ArrayBuffer) back to its original form.
    • encryptFile(file: File, key: string): Promise<Blob>  
          Asynchronously reads and encrypts a file (or voice note) and returns an encrypted Blob.
    • decryptFile(file: File, key: string): Promise<Blob>  
          Asynchronously reads and decrypts a file (or voice note) and returns a decrypted Blob.
*/
export const useEncryptDecrypt = () => {
  // Function for encrypting text
  const encryptText = useCallback((plaintext: string | undefined, key: string | undefined) => {
    if (!key) {
      throw new Error('A key is required for encryption.');
    }
    // Convert the plaintext to a Uint8Array.
    const plainData = stringToUint8Array(plaintext);
    const keyData = stringToUint8Array(key);
    // Encrypt using XOR.
    const encryptedData = xorEncryptData(plainData, keyData);
    // Convert encrypted binary data to Base64 for display/storage.
    return uint8ArrayToBase64(encryptedData);
  }, []);

  // Function for decrypting text that was Base64-encoded.
  const decryptText = useCallback((ciphertext: string, key: string | undefined) => {
    if (!key) {
      throw new Error('A key is required for decryption.');
    }
    try {
      // Convert Base64 string back to Uint8Array.
      const cipherData = base64ToUint8Array(ciphertext);
      const keyData = stringToUint8Array(key);
      // Apply XOR decryption (which is symmetric with encryption).
      const decryptedData = xorEncryptData(cipherData, keyData);
      // Convert back to plaintext.
      return uint8ArrayToString(decryptedData);
    } catch (error) {
      throw new Error('Decryption failed. Please check the ciphertext and key.');
    }
  }, []);

  // Functions for encrypting/decrypting binary data (ArrayBuffer).

// Function to encrypt an ArrayBuffer using a simple XOR cipher.
const encryptArrayBuffer = useCallback((buffer: any, key: string | undefined) => {
  // Check if a key is provided; if not, throw an error.
  if (!key) {
    throw new Error('A key is required for encryption.');
  }
  // Create a Uint8Array view on the provided ArrayBuffer.
  // This allows us to work with the binary data byte by byte.
  const dataUint8 = new Uint8Array(buffer);
  
  // Convert the key (which is a string) to a Uint8Array.
  // This conversion enables byte-wise XOR operations between the data and the key.
  const keyData = stringToUint8Array(key);
  
  // Call the xorEncryptData function to apply the XOR cipher on the binary data.
  // The function returns a new Uint8Array containing the encrypted bytes.
  const encryptedData = xorEncryptData(dataUint8, keyData);
  
  // Return the underlying ArrayBuffer from the resulting Uint8Array.
  // This ArrayBuffer represents the encrypted binary data.
  return encryptedData.buffer;
}, []);

// Function to decrypt an ArrayBuffer using a simple XOR cipher.
// Note: Since XOR is symmetric, decryption uses the same operation as encryption.
const decryptArrayBuffer = useCallback((buffer: any, key: string | undefined) => {
  // Check if a key is provided; if not, throw an error.
  if (!key) {
    throw new Error('A key is required for decryption.');
  }
  // Create a Uint8Array view on the provided ArrayBuffer.
  // This enables byte-by-byte manipulation of the encrypted data.
  const dataUint8 = new Uint8Array(buffer);
  
  // Convert the key string into a Uint8Array.
  // This conversion is essential to perform the XOR decryption operation.
  const keyData = stringToUint8Array(key);
  
  // Call the xorEncryptData function with the encrypted data and key.
  // Due to the symmetric nature of XOR, this operation will decrypt the data.
  const decryptedData = xorEncryptData(dataUint8, keyData);
  
  // Return the underlying ArrayBuffer from the resulting Uint8Array.
  // This ArrayBuffer now contains the original, decrypted binary data.
  return decryptedData.buffer;
}, []);


  // Asynchronous functions to process files (or voice note files)
  const encryptFile = useCallback(
    // This function takes a File object and a decryption key and returns a Promise.
    // The Promise resolves with an encrypted Blob.
    (file: Blob, key: string | undefined) =>
      new Promise((resolve, reject) => {
        // Check if a key is provided. If not, reject the promise with an error message.
        if (!key) {
          reject(new Error('A key is required for encryption.'));
          return; // Exit early if the key is missing.
        }
        
        // Create a new FileReader instance, which will be used to read the file's data.
        const reader = new FileReader();
  
        // Define what should happen when the FileReader successfully loads the file data.
        // The onload event is triggered once the file is read successfully.
        reader.onload = (e) => {
          // Check that the event target exists and that result is available.
          if (!e.target || !e.target.result) {
            reject(new Error('FileReader result is not available.'));
            return; // Exit early if the file's result is unavailable.
          }
          try {
            // e.target.result contains the file's content as an ArrayBuffer.
            // Call the encryptArrayBuffer function to encrypt the ArrayBuffer using the provided key.
            // This function applies a reversible XOR cipher on the binary data.
            const encryptedBuffer = encryptArrayBuffer(e.target.result, key);
            
            // Create a new Blob using the encrypted ArrayBuffer.
            // Use the original file's MIME type (file.type) to ensure the Blob has the correct format.
            const encryptedBlob = new Blob([encryptedBuffer], { type: file.type });
            
            // Resolve the Promise with the newly created encrypted Blob.
            resolve(encryptedBlob);
          } catch (err) {
            // If any error occurs during encryption, reject the Promise with the error.
            reject(err);
          }
        };
        
  
        // Define what should happen if an error occurs during the file reading process.
        reader.onerror = () => {
          // Reject the Promise with an error indicating that the file could not be read.
          reject(new Error('Error reading file for encryption.'));
        };
  
        // Begin reading the file as an ArrayBuffer.
        // This triggers the FileReader to asynchronously read the file's data.
        reader.readAsArrayBuffer(file);
      }),
    // Provide encryptArrayBuffer as a dependency so that the function is recreated if encryptArrayBuffer changes.
    [encryptArrayBuffer]
  );
  

  const decryptFile = useCallback(
    // Define a function that takes a File object and a decryption key,
    // and returns a Promise that resolves with the decrypted Blob.
    (file: Blob, key: string | undefined) =>
      new Promise((resolve, reject) => {
        // Check if the provided key is valid; if not, reject the promise with an error.
        if (!key) {
          reject(new Error('A key is required for decryption.'));
          return; // Exit the function early if key is missing.
        }
  
        // Create a new FileReader instance to read the contents of the file.
        const reader = new FileReader();
  
        // Set up the FileReader's onload event handler, which is called when the file is successfully read.
        reader.onload = (e) => {
          // Check that the event target exists and that result is available.
          if (!e.target || !e.target.result) {
            reject(new Error('FileReader result is not available.'));
            return;
          }
          try {
            // e.target.result contains the file's content as an ArrayBuffer.
            // Pass this ArrayBuffer and the key to the decryptArrayBuffer function to perform the XOR decryption.
            const decryptedBuffer = decryptArrayBuffer(e.target.result, key);
            
            // Create a new Blob from the decrypted ArrayBuffer.
            // We use the same MIME type as the original file (file.type) for consistency.
            const decryptedBlob = new Blob([decryptedBuffer], { type: file.type });
            
            // Resolve the Promise with the decrypted Blob, making it available to the caller.
            resolve(decryptedBlob);
          } catch (err) {
            // If any error occurs during decryption, reject the Promise with the error.
            reject(err);
          }
        };
        
  
        // Set up the FileReader's onerror event handler, which is called if an error occurs during the file reading process.
        reader.onerror = () => {
          // Reject the Promise with an error indicating that reading the file failed.
          reject(new Error('Error reading file for decryption.'));
        };
  
        // Initiate reading of the file as an ArrayBuffer.
        // This triggers the asynchronous file reading process.
        reader.readAsArrayBuffer(file);
      }),
    // Specify decryptArrayBuffer as a dependency for useCallback, ensuring it is up-to-date.
    [decryptArrayBuffer]
  );
  

  return {
    encryptText,
    decryptText,
    encryptArrayBuffer,
    decryptArrayBuffer,
    encryptFile,
    decryptFile,
  };
};
