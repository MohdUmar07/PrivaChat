const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");

const chatController = require("../controllers/chatController");

router.get("/keys/:username", verifyToken, chatController.getPublicKey);
router.get("/users", verifyToken, chatController.getUsers);
router.get("/messages/:username", verifyToken, chatController.getMessages);

router.post("/sendMessage", verifyToken, (req, res) => {
  // Message sending logic goes here (Authentication handled, but payload is blind forwarded by socket mostly)
  // This REST endpoint might be redundant if we use Socket.io for everything, but keeping it for now.
  res.status(200).json({ message: "Message sent!" });
});

module.exports = router;
