# PrivaChat Backend

The backend server for PrivaChat, built with Node.js, Express, Socket.io, and MongoDB.

## Features

- **Socket.io**: Real-time bidirectional event-based communication.
- **REST API**: Endpoints for user authentication and data retrieval.
- **MongoDB**: Stores user profiles and encrypted chat history.
- **Security Check**: Verifies JWT tokens for protected routes.

## API Endpoints

### Auth

- `POST /api/auth/register`: Register a new user with a public key.
- `POST /api/auth/login`: Authenticate and receive a JWT.

### Chat

- `GET /api/chat/users`: Get list of registered users.
- `GET /api/chat/keys/:username`: Fetch a user's public key.
- `GET /api/chat/messages/:username`: Fetch encrypted chat history with a specific user.

## Socket Events

- `join`: User joins their own personal room (by username).
- `sendMessage`: Sends an encrypted message. Payload includes `encryptedData`, `iv`, `encryptedKey` (for recipient), and `senderEncryptedKey` (for sender history).
- `receiveMessage`: Event emitted to the recipient with the message payload.

## Setup

1. Create a `.env` file in this directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/privateChat
   JWT_SECRET=your_secret_key
   ```
2. Install dependencies: `npm install`
3. Run server: `npm start`
