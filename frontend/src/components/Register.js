import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User, Mail } from "lucide-react";
import { generateKeyPair, exportPublicKey, exportPrivateKey, encryptPrivateKeyWithPassword } from "../CryptoUtils";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. Generate Key Pair
      const keyPair = await generateKeyPair();

      // 2. Export Keys
      const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
      const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

      // 3. Encrypt Private Key with Password
      const encryptedPrivateKey = await encryptPrivateKeyWithPassword(privateKeyBase64, password);

      // 4. Store Private Key securely (locally for this session)
      localStorage.setItem("privateKey", privateKeyBase64);

      // 5. Register User with Public Key AND Encrypted Private Key
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          publicKey: publicKeyBase64,
          encryptedPrivateKey
        }),
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/"); // Redirect to login
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Error registering user");
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
            Create Account
          </h2>
          <p className="text-gray-400 mt-2">Join PrivaChat for secure messaging</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
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
            <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Create Account
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Already have an account?{" "}
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default Register;
