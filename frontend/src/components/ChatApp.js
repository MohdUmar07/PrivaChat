import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, LogOut, MoreVertical, Phone, Video, Search, User, Lock, ArrowLeft } from "lucide-react";
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

// Initialize Socket.io
const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");

const ChatApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load User & Private Key on Mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedPrivateKey = localStorage.getItem("privateKey");

    if (!token || !storedPrivateKey) {
      navigate("/");
      return;
    }

    if (!storedUsername) {
      console.error("Username missing in local storage. Relogin required.");
      navigate("/");
      return;
    }

    setCurrentUser(storedUsername);

    // Fetch All Users
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/users`, {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setUsers(data.filter((u) => u.username !== storedUsername));
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();

    // Join my own room
    socket.emit("join", storedUsername);

    // Listeners
    const handleReceiveMessage = async (payload) => {
      const { from, encryptedData, iv, encryptedKey } = payload;
      const privateKeyBase64 = localStorage.getItem("privateKey");

      try {
        if (!privateKeyBase64) throw new Error("No private key found");
        const myPrivKey = await importPrivateKey(privateKeyBase64);
        const aesKeyBuffer = await decryptRSA(myPrivKey, encryptedKey);
        const aesKeyBase64 = arrayBufferToBase64(aesKeyBuffer);
        const aesKey = await importSymKey(aesKeyBase64);
        const decryptedText = await decryptMessage(aesKey, iv, encryptedData);

        const newMessage = {
          sender: from,
          text: decryptedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "received"
        };

        setMessages((prev) => ({
          ...prev,
          [from]: [...(prev[from] || []), newMessage]
        }));

        // If we receive a message, they stopped typing properly
        if (selectedUser?.username === from) {
          setIsTyping(false);
        }

      } catch (err) {
        console.error("Failed to decrypt message from", from, err);
      }
    };

    const handleIncoming = async (payload) => {
      await handleReceiveMessage(payload);
    };

    const handleOnlineUsers = (usersList) => {
      setUsers(prevUsers => prevUsers.map(u => ({
        ...u,
        isOnline: usersList.includes(u.username)
      })));
    };

    const handleTyping = ({ from }) => {
      if (selectedUser?.username === from) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ from }) => {
      if (selectedUser?.username === from) {
        setIsTyping(false);
      }
    };

    socket.on("receiveMessage", handleIncoming);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleIncoming);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [navigate, selectedUser]); // Re-bind listeners when selectedUser changes to ensure typing check works

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser, isTyping]);

  // Load History
  useEffect(() => {
    if (!selectedUser || !currentUser) return;
    setIsTyping(false); // Reset typing state when switching users

    const loadHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/messages/${selectedUser.username}`, {
          headers: { Authorization: token },
        });
        const data = await res.json();

        const privateKeyBase64 = localStorage.getItem("privateKey");
        if (!privateKeyBase64) return;
        const myPrivKey = await importPrivateKey(privateKeyBase64);

        const decryptedMsgs = await Promise.all(data.map(async (msg) => {
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
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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



  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!selectedUser) return;

    socket.emit("typing", { to: selectedUser.username, from: currentUser });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { to: selectedUser.username, from: currentUser });
    }, 2000);
  };

  // Handle Sending Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedUser) return;

    socket.emit("stopTyping", { to: selectedUser.username, from: currentUser });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const recipientUsername = selectedUser.username;
      const token = localStorage.getItem("token");

      // Fetch Recipient Public Key
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/keys/${recipientUsername}`, {
        headers: { Authorization: token },
      });
      const data = await res.json();

      const recipientPublicKeyBase64 = data.publicKey;
      if (!recipientPublicKeyBase64) {
        setError(`User ${recipientUsername} has no public key!`);
        return;
      }

      let recipientPublicKey;
      try {
        recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);
      } catch (e) {
        console.error("Failed to import recipient public key", e);
        setError(`User ${recipientUsername} has an invalid public key.`);
        return;
      }

      const aesKey = await generateAESKey();
      const { iv, ciphertext } = await encryptMessage(aesKey, inputText);

      const aesKeyRawBase64 = await exportSymKey(aesKey);
      const aesKeyBuffer = base64ToArrayBuffer(aesKeyRawBase64);
      const encryptedAesKeyBase64 = await encryptRSA(recipientPublicKey, aesKeyBuffer);

      // Encrypt AES Key with My Public Key
      const myPublicKeyRes = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/keys/${currentUser}`, {
        headers: { Authorization: token },
      });
      const myPublicKeyData = await myPublicKeyRes.json();
      const myPublicKey = await importPublicKey(myPublicKeyData.publicKey);
      const myEncryptedAesKeyBase64 = await encryptRSA(myPublicKey, aesKeyBuffer);

      const payload = {
        from: currentUser,
        encryptedData: ciphertext, // Base64
        iv: iv, // Base64
        encryptedKey: encryptedAesKeyBase64, // Base64
        senderEncryptedKey: myEncryptedAesKeyBase64, // Base64
        to: recipientUsername
      };

      socket.emit("sendMessage", payload, recipientUsername);

      const myMessage = {
        sender: "Me",
        text: inputText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] rounded-2xl overflow-hidden glass-panel shadow-2xl relative">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/10 flex-col bg-white/5 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              PrivaChat
            </h2>
            <div className="flex gap-2">
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {users.map((user) => (
            <motion.div
              key={user._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedUser?.username === user.username
                ? 'bg-blue-600/20 border border-blue-500/30'
                : 'hover:bg-white/5 border border-transparent'
                }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative">
                {user.username[0].toUpperCase()}
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{user.username}</h3>
                <p className="text-xs text-gray-400 truncate">Tap to chat</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-bold text-white">{currentUser}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex-col bg-[#0f172a]/50 relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 hover:bg-white/10 rounded-full text-white/70 transition-colors mr-1"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">{selectedUser.username}</h3>
                  {selectedUser.isOnline && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Online
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 md:gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full text-white/70 transition-colors">
                  <Phone size={20} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full text-white/70 transition-colors">
                  <Video size={20} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full text-white/70 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages[selectedUser.username]?.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-3 ${msg.type === 'sent'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white/10 text-white rounded-bl-none'
                    }`}>
                    <p className="break-words leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.type === 'sent' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 text-white rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
              <div className="flex gap-2 items-center bg-white/5 rounded-xl p-1 border border-white/10 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a secure message..."
                  className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Send size={18} />
                </motion.button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-500 flex items-center justify-center gap-1 opacity-60">
                  <Lock size={10} /> End-to-End Encrypted
                </span>
              </div>
              {error && <p className="text-red-400 text-xs text-center mt-1">{error}</p>}
            </div>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#0f172a]/50">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} className="text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to PrivaChat</h3>
            <p className="text-gray-400 max-w-sm">Select a contact from the sidebar to start a secure, end-to-end encrypted conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;
