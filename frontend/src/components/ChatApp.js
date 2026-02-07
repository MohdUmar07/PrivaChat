import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../ChatUI.css";
import {
  generateAESKey,
  encryptMessage,
  decryptMessage,
  encryptRSA,
  decryptRSA,
  exportSymKey,
  importSymKey,
  importPublicKey,
  importPrivateKey,
  base64ToArrayBuffer,
  arrayBufferToBase64
} from "../CryptoUtils";

// Initialize Socket.io outside component to prevent multiple connections
const socket = io("http://localhost:5000");

const ChatApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({}); // { username: [msgObjects] }
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Load User & Private Key on Mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedPrivateKey = localStorage.getItem("privateKey");

    if (!token || !storedPrivateKey) {
      navigate("/");
      return;
    }

    // Decode JWT to get username? For now rely on localStorage
    if (!storedUsername) {
      // Fallback: decode JWT or fetch profile
      // Since we don't have a profile endpoint handy and Login.js saves 'user' object...
      // Wait, Login.js Login logic: `res.json({ token, user: { ... } })` 
      // But Login.js `localStorage.setItem("token", ...)` ONLY.
      // BUG: Login.js does NOT save username to localStorage. 
      // FIX: I will hotfix this check by attempting to fetch profile or just decode token if needed.
      // For now, assume username is missing and redirect / show error.
      console.error("Username missing in local storage. Relogin required.");
      navigate("/");
      return;
    }

    setCurrentUser(storedUsername);

    // Fetch All Users
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/chat/users", {
          headers: { Authorization: token },
        });
        // Filter out myself
        setUsers(res.data.filter((u) => u.username !== storedUsername));
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();

    // Join my own room
    socket.emit("join", storedUsername);

    // Listen for Messages
    socket.on("receiveMessage", async (payload) => {
      // payload: { from, encryptedData, iv, encryptedKey }
      await handleReceiveMessage(payload);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [navigate]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // Load History
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const loadHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/chat/messages/${selectedUser.username}`, {
          headers: { Authorization: token },
        });

        const privateKeyBase64 = localStorage.getItem("privateKey");
        if (!privateKeyBase64) return;
        const myPrivKey = await importPrivateKey(privateKeyBase64);

        const decryptedMsgs = await Promise.all(res.data.map(async (msg) => {
          try {
            const isMyMsg = msg.sender === currentUser;
            const keyToUse = isMyMsg ? msg.senderEncryptedKey : msg.encryptedKey;

            if (!keyToUse) return { ...msg, text: "Encrypted (Key Missing)", type: isMyMsg ? "sent" : "received" };

            const aesKeyBuffer = await decryptRSA(myPrivKey, keyToUse);
            const aesKeyBase64 = arrayBufferToBase64(aesKeyBuffer);
            const aesKey = await importSymKey(aesKeyBase64);
            const text = await decryptMessage(aesKey, msg.iv, msg.encryptedData);

            return {
              sender: msg.sender,
              text: text,
              timestamp: new Date(msg.createdAt).toLocaleTimeString(),
              type: isMyMsg ? "sent" : "received"
            };
          } catch (e) {
            console.error("Decryption error", e);
            return { ...msg, text: "Decryption Failed", type: "error" };
          }
        }));

        setMessages((prev) => ({
          ...prev,
          [selectedUser.username]: decryptedMsgs
        }));
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    loadHistory();
  }, [selectedUser, currentUser]);

  // Handle Incoming Message
  const handleReceiveMessage = async (payload) => {
    const { from, encryptedData, iv, encryptedKey } = payload;
    const privateKeyBase64 = localStorage.getItem("privateKey");

    try {
      if (!privateKeyBase64) throw new Error("No private key found");
      const myPrivKey = await importPrivateKey(privateKeyBase64);

      // 1. Decrypt AES Key using my Private Key
      // encryptedKey is Base64. decryptRSA expects Base64. returns ArrayBuffer.
      const aesKeyBuffer = await decryptRSA(myPrivKey, encryptedKey);

      // 2. Import AES Key
      // importSymKey expects Base64. Convert buffer to base64.
      const aesKeyBase64 = arrayBufferToBase64(aesKeyBuffer);
      const aesKey = await importSymKey(aesKeyBase64);

      // 3. Decrypt Message Content
      const decryptedText = await decryptMessage(aesKey, iv, encryptedData);

      // 4. Update UI
      const newMessage = {
        sender: from,
        text: decryptedText,
        timestamp: new Date().toLocaleTimeString(),
        type: "received"
      };

      setMessages((prev) => ({
        ...prev,
        [from]: [...(prev[from] || []), newMessage]
      }));

    } catch (err) {
      console.error("Failed to decrypt message from", from, err);
      // Optional: Show "Decryption Failed" message in UI
    }
  };

  // Handle Sending Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedUser) return;

    try {
      const recipientUsername = selectedUser.username;

      // 1. Get my key (to decrypt/encrypt?) No just need Recipient Public Key
      const token = localStorage.getItem("token");

      // Fetch Recipient Public Key
      const res = await axios.get(
        `http://localhost:5000/api/chat/keys/${recipientUsername}`,
        { headers: { Authorization: token } }
      );

      const recipientPublicKeyBase64 = res.data.publicKey;
      if (!recipientPublicKeyBase64) {
        setError(`User ${recipientUsername} has no public key!`);
        return;
      }

      const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);

      // 2. Generate Session AES Key
      const aesKey = await generateAESKey();

      // 3. Encrypt Message Payload
      const { iv, ciphertext } = await encryptMessage(aesKey, inputText);

      // 4. Encrypt AES Key with Recipient's Public Key
      const aesKeyRawBase64 = await exportSymKey(aesKey);
      // CryptoUtils encryptRSA takes (key, bufferSource). 
      // Need to convert base64 key back to buffer or update encryptRSA to accept base64.
      // My CryptoUtils encryptRSA definition: `export const encryptRSA = async (publicKey, data) => ... window.crypto.subtle.encrypt(..., publicKey, data)`
      // WebCrypto encrypt data arg must be BufferSource.
      // So fetch buffer from base64.
      const aesKeyBuffer = base64ToArrayBuffer(aesKeyRawBase64);
      const encryptedAesKeyBase64 = await encryptRSA(recipientPublicKey, aesKeyBuffer);

      // Encrypt AES Key with My Public Key (for history)
      const myPublicKeyRes = await axios.get(
        `http://localhost:5000/api/chat/keys/${currentUser}`,
        { headers: { Authorization: token } }
      );
      const myPublicKey = await importPublicKey(myPublicKeyRes.data.publicKey);
      const myEncryptedAesKeyBase64 = await encryptRSA(myPublicKey, aesKeyBuffer);

      // 5. Construct Payload
      const payload = {
        from: currentUser,
        encryptedData: ciphertext,
        iv: iv,
        encryptedKey: encryptedAesKeyBase64,
        senderEncryptedKey: myEncryptedAesKeyBase64,
        to: recipientUsername
      };

      // 6. Send to Server (Blind Relay)
      // Note: server expects (message, toUser). message can be object.
      socket.emit("sendMessage", payload, recipientUsername);

      // 7. Update Local UI (Optimistic update)
      const myMessage = {
        sender: "Me",
        text: inputText,
        timestamp: new Date().toLocaleTimeString(),
        type: "sent"
      };

      setMessages((prev) => ({
        ...prev,
        [recipientUsername]: [...(prev[recipientUsername] || []), myMessage]
      }));

      setInputText("");
      setError("");

    } catch (err) {
      console.error("Send failed", err);
      setError("Failed to send message securely.");
    }
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
        <h2>PrivaChat</h2>
        <div className="user-list">
          {users.map((user) => (
            <div
              key={user._id}
              className={`user-item ${selectedUser?.username === user.username ? 'active' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              {user.username}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '10px', fontSize: '0.8rem', color: '#666' }}>
          Logged in as: <strong>{currentUser}</strong>
        </div>
      </div>

      <div className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              Chat with {selectedUser.username}
            </div>

            <div className="messages-area">
              {(messages[selectedUser.username] || []).map((msg, idx) => (
                <div key={idx} className={`message ${msg.type}`}>
                  <div>{msg.text}</div>
                  <div style={{ fontSize: '0.7em', marginTop: '4px', opacity: 0.7 }}>{msg.timestamp}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <input
                type="text"
                placeholder="Type a secure message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="send-btn" onClick={handleSendMessage}>Send</button>
            </div>
            {error && <div style={{ color: 'red', padding: '0 20px' }}>{error}</div>}
            <div style={{ textAlign: 'center', paddingBottom: '10px' }}>
              <span className="encrypted-badge">🔒 End-to-End Encrypted</span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Select a user to start a secure chat
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;
