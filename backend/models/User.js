const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  displayName: {
    type: String,
    trim: true,
    default: "",
  },
  about: {
    type: String,
    trim: true,
    default: "Hey there! I am using PrivaChat.",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String, // Base64 encoded public key
    required: true,
  },
  encryptedPrivateKey: {
    type: String, // Base64 encoded encrypted private key
    required: true,
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
