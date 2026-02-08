const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
    },
    recipient: {
        type: String,
        required: true,
    },
    encryptedData: {
        type: String,
        required: true,
    },
    iv: {
        type: String, // Initialization vector
        required: true,
    },
    encryptedKey: {
        type: String, // AES key encrypted with recipient's public key
        required: true,
    },
    senderEncryptedKey: {
        type: String, // AES key encrypted with sender's public key
        required: true,
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    reactions: [{
        user: { type: String, required: true }, // username
        emoji: { type: String, required: true }
    }],
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
