import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";

import LoadingSpinner from "./LoadingSpinner";
import AlertModal from "./AlertModal";
import { decryptPrivateKeyWithPassword } from "../CryptoUtils";
import API_URL from "../config";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
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
            setAlertModal({
              isOpen: true,
              title: "Decryption Failed",
              message: "Login successful, but failed to decrypt your private key. Please check your password.",
              type: "error"
            });
            setLoading(false);
            return; // Don't redirect if key decryption fails
          }
        }

        navigate("/chat");
      } else {
        setAlertModal({
          isOpen: true,
          title: "Login Failed",
          message: data.message || "Invalid credentials",
          type: "error"
        });
      }
    } catch (err) {
      console.error(err);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "An error occurred during login. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
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

          <button type="submit" className="glass-button flex justify-center items-center" disabled={loading}>
            {loading ? <LoadingSpinner size={24} color="text-white" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Register
          </Link>
        </p>
      </div>


      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </motion.div >
  );
}

export default Login;
