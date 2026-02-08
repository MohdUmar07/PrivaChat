const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");

const chatController = require("../controllers/chatController");

router.get("/keys/:username", verifyToken, chatController.getPublicKey);
router.get("/contacts", verifyToken, chatController.getContacts);
router.get("/messages/:username", verifyToken, chatController.getMessages);

// Contact Management
router.get("/search", verifyToken, chatController.searchUsers);
router.post("/request", verifyToken, chatController.sendFriendRequest);
router.get("/requests", verifyToken, chatController.getFriendRequests);
router.post("/request/respond", verifyToken, chatController.respondToFriendRequest);

router.post("/sendMessage", verifyToken, (req, res) => {
  // Message sending logic goes here (Authentication handled, but payload is blind forwarded by socket mostly)
  // This REST endpoint might be redundant if we use Socket.io for everything, but keeping it for now.
  res.status(200).json({ message: "Message sent!" });
});

module.exports = router;
