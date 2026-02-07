# PrivaChat Frontend

The React-based client for PrivaChat. It handles client-side encryption/decryption and real-time UI updates.

## Key Components

- **ChatApp.js**: Main chat interface. Handles user selection, message history loading, and real-time socket events.
- **CryptoUtils.js**: Web Crypto API wrappers for RSA (key pairs, key exchange) and AES-GCM (message encryption).
- **Register.js**: Generates an RSA key pair upon registration and uploads the public key to the server.

## Encryption Flow

1. **Registration**: 
   - Browser generates RSA-2048 Key Pair.
   - Public Key -> Sent to Server.
   - Private Key -> Stored in Local Storage.

2. **Sending a Message**:
   - Generate ephemeral AES-256 key.
   - Encrypt message text with AES key.
   - Fetch Recipient's Public Key from server.
   - Encrypt AES key with Recipient's Public Key.
   - Encrypt AES key *again* with Sender's Public Key (for history).
   - Send payload to server.

3. **Receiving a Message**:
   - Listen for `receiveMessage` event.
   - Decrypt AES key using stored Private Key.
   - Decrypt message content using AES key.

## Setup

1. Install dependencies: `npm install`
2. Run client: `npm start`
3. Open `http://localhost:3000`
