# PrivaChat

PrivaChat is a secure, end-to-end encrypted chat application designed for privacy and security. It features real-time messaging, user authentication, and persistent chat history with client-side encryption.

## Project Structure

- **frontend/**: React-based user interface.
- **backend/**: Node.js/Express server with MongoDB and Socket.io.

## Key Features

- **End-to-End Encryption (E2EE)**: Messages are encrypted on the device before being sent. The server only sees encrypted data.
- **Real-time Messaging**: Powered by Socket.io for instant communication.
- **Secure Authentication**: JWT-based authentication.
- **Message Persistence**: Encrypted messages are stored in MongoDB essentially for history access.
- **Self-Decryption**: Senders can decrypt their own sent messages (using a dual-encryption scheme).

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. **Clone the repository**
2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```
3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the App

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server runs on `http://localhost:5000`.

2. **Start Frontend Client**
   ```bash
   cd frontend
   npm start
   ```
   Client runs on `http://localhost:3000`.

## Security

- RSA Key Pairs are generated on registration.
- Private keys are stored locally (Local Storage for demo purposes).
- AES Session keys are used for message encryption, exchanged via RSA.
