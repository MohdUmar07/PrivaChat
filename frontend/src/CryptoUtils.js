// Utility for converting ArrayBuffer to Base64
export const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Utility for converting Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// Generate RSA Key Pair 
export const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
};

// Export public key 
export const exportPublicKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return arrayBufferToBase64(exported);
};

// Import public key 
export const importPublicKey = async (base64Key) => {
    try {
        const buffer = base64ToArrayBuffer(base64Key);
        return await window.crypto.subtle.importKey(
            "spki",
            buffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
    } catch (e) {
        console.error("Invalid public key format:", e);
        throw new Error("Invalid public key format");
    }
};

// Export private key 
export const exportPrivateKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return arrayBufferToBase64(exported);
};

// Import private key 
export const importPrivateKey = async (base64Key) => {
    const buffer = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
        "pkcs8",
        buffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
};

// --- PBKDF2 Key Derivation for Secure Key Storage ---

const deriveKeyFromPassword = async (password, salt) => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

// Encrypt Private Key with Password
export const encryptPrivateKeyWithPassword = async (privateKeyBase64, password) => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKeyFromPassword(password, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const data = encoder.encode(privateKeyBase64);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    // Format: salt + iv + ciphertext (all combined or object)
    // We'll return a JSON string containing base64 parts for easier storage
    return JSON.stringify({
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        ciphertext: arrayBufferToBase64(encrypted)
    });
};

// Decrypt Private Key with Password
export const decryptPrivateKeyWithPassword = async (encryptedBundleJson, password) => {
    try {
        const bundle = JSON.parse(encryptedBundleJson);
        const salt = base64ToArrayBuffer(bundle.salt);
        const iv = base64ToArrayBuffer(bundle.iv);
        const ciphertext = base64ToArrayBuffer(bundle.ciphertext);

        const key = await deriveKeyFromPassword(password, new Uint8Array(salt));

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error("Failed to decrypt private key with password:", e);
        throw new Error("Invalid password or corrupted key data");
    }
};


// ----------------------------------------------------

// Generate a random AES key (for message encryption)
export const generateAESKey = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
};

// Export AES key (raw)
export const exportSymKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
};

// Import AES key (raw)
export const importSymKey = async (base64Key) => {
    const buffer = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
        "raw",
        buffer,
        {
            name: "AES-GCM",
        },
        true,
        ["encrypt", "decrypt"]
    );
};

// Encrypt a message using AES key
export const encryptMessage = async (key, message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Random IV
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );
    return {
        iv: arrayBufferToBase64(iv),
        ciphertext: arrayBufferToBase64(encrypted),
    };
};

// Decrypt a message using AES key
export const decryptMessage = async (key, ivBase64, ciphertextBase64) => {
    const iv = base64ToArrayBuffer(ivBase64);
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(iv),
        },
        key,
        ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
};

// Encrypt data (e.g., AES key) using RSA Public Key
export const encryptRSA = async (publicKey, data) => {
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        data
    );
    return arrayBufferToBase64(encrypted);
};

// Decrypt data (e.g., AES key) using RSA Private Key
export const decryptRSA = async (privateKey, base64Data) => {
    try {
        const data = base64ToArrayBuffer(base64Data);
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            privateKey,
            data
        );
        return decrypted;
    } catch (e) {
        console.error("decryptRSA failed:", e);
        throw e;
    }
};

// Validates if the browser supports Web Crypto API
export const checkCryptoSupport = () => {
    return window.crypto && window.crypto.subtle;
};
