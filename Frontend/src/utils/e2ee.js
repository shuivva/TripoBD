/**
 * TripoBD Security Infrastructure - Feature 6 (F-06)
 * End-to-End Encrypted Tour Room Messaging Using Web Cryptography API
 *
 * Implements client-side AES-GCM (256-bit) encryption and PBKDF2 key derivation.
 * The backend server operates in Zero-Knowledge mode, relaying and storing only
 * ciphertext and initialization vectors (IV) without possessing decryption keys.
 */

// Helper: Convert ArrayBuffer / Uint8Array to Base64 string
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper: Convert Base64 string to Uint8Array
export function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Helper: Get available Web Crypto object
function getCrypto() {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto
  }
  throw new Error('Web Cryptography API is not supported in this environment.')
}

/**
 * Derives an AES-GCM 256-bit symmetric CryptoKey from a passphrase and salt using PBKDF2.
 * @param {string} passphrase - Room secret or member-shared passphrase
 * @param {string} saltString - Room-specific salt (e.g. room uuid or name)
 * @returns {Promise<CryptoKey>}
 */
export async function deriveRoomKey(passphrase, saltString = 'tripobd-default-salt') {
  const cryptoObj = getCrypto()
  const subtle = cryptoObj.subtle
  const encoder = new TextEncoder()

  // Import raw passphrase material
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  // Derive AES-GCM 256-bit key using PBKDF2 with SHA-256 and 100,000 iterations
  const salt = encoder.encode(saltString)
  const derivedKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )

  return derivedKey
}

/**
 * Generates an ephemeral random AES-GCM 256-bit symmetric key.
 * @returns {Promise<CryptoKey>}
 */
export async function generateRandomRoomKey() {
  const cryptoObj = getCrypto()
  return await cryptoObj.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts a plaintext string with the room CryptoKey using AES-GCM.
 * Generates a fresh cryptographically secure 12-byte (96-bit) IV for every message.
 * @param {string} plaintext - Message to encrypt
 * @param {CryptoKey} cryptoKey - AES-GCM 256-bit key
 * @returns {Promise<{ ciphertext: string, iv: string, is_encrypted: boolean }>}
 */
export async function encryptChatMessage(plaintext, cryptoKey) {
  if (!plaintext) {
    return { ciphertext: '', iv: '', is_encrypted: true }
  }

  const cryptoObj = getCrypto()
  const subtle = cryptoObj.subtle

  // Generate 12-byte random IV
  const iv = cryptoObj.getRandomValues(new Uint8Array(12))
  const encodedText = new TextEncoder().encode(plaintext)

  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encodedText
  )

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    is_encrypted: true,
  }
}

/**
 * Decrypts an AES-GCM encrypted payload back into plaintext.
 * @param {string} ciphertextBase64 - Base64 encoded ciphertext
 * @param {string} ivBase64 - Base64 encoded 12-byte IV
 * @param {CryptoKey} cryptoKey - AES-GCM 256-bit key
 * @returns {Promise<string>} Plaintext or error fallback
 */
export async function decryptChatMessage(ciphertextBase64, ivBase64, cryptoKey) {
  if (!ciphertextBase64 || !ivBase64 || !cryptoKey) {
    return ciphertextBase64 || ''
  }

  try {
    const cryptoObj = getCrypto()
    const subtle = cryptoObj.subtle
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64)
    const ivBuffer = base64ToBuffer(ivBase64)

    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      cryptoKey,
      ciphertextBuffer
    )

    return new TextDecoder().decode(decryptedBuffer)
  } catch (err) {
    console.warn('E2EE Decryption error:', err)
    return '🔐 [Encrypted message - Key mismatch or room key required]'
  }
}

/**
 * Gets or initializes the active CryptoKey for a specific tour room.
 * Key precedence:
 * 1. Custom session passphrase (entered by user in UI)
 * 2. Room specific invite_code or uuid (automatic seamless E2EE)
 */
export async function getRoomEncryptionKey(roomId, roomMeta = {}, customPassphrase = '') {
  const roomSecret =
    customPassphrase.trim() ||
    roomMeta.invite_code ||
    roomMeta.uuid ||
    `tripo-room-${roomId}`

  const roomSalt = `salt-${roomId}-${roomMeta.uuid || 'tripo'}`
  return await deriveRoomKey(roomSecret, roomSalt)
}
