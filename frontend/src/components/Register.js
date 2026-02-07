import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { generateKeyPair, exportPublicKey, exportPrivateKey } from "../CryptoUtils";

const Register = () => {
  const [username, setUsername] = useState("");  // Changed to username
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

      // 3. Store Private Key securely (locally for now)
      localStorage.setItem("privateKey", privateKeyBase64);

      // 4. Register User with Public Key
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
        publicKey: publicKeyBase64
      });
      navigate("/"); // Redirect to login after successful registration
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <div className="input-group">
          <input
            type="text"
            placeholder="Username"  // Changed placeholder to Username
            value={username}
            onChange={(e) => setUsername(e.target.value)}  // Handling input for username
            required
          />
        </div>
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="button">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
