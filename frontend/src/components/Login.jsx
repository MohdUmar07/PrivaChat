import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import { decryptPrivateKeyWithPassword } from "../CryptoUtils";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username); // Use returned username

        // Decrypt and Store Private Key
        if (data.user.encryptedPrivateKey) {
          try {
            const privateKey = await decryptPrivateKeyWithPassword(data.user.encryptedPrivateKey, password);
            localStorage.setItem("privateKey", privateKey);
          } catch (decryptionErr) {
            console.error("Failed to decrypt private key:", decryptionErr);
            alert("Login successful, but failed to decrypt your private key. Please check your password.");
            return; // Don't redirect if key decryption fails
          }
        }

        navigate("/chat");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error logging in");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto"
    >
      <div className="glass-panel p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Welcome Back
          </h2>
          <p className="text-gray-400 mt-2">Sign in to continue to PrivaChat</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input pl-12"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input pl-12"
              required
            />
          </div>

          <button type="submit" className="glass-button">
            Sign In
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default Login;
