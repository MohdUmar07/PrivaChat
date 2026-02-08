const User = require("../models/User");
const Message = require("../models/Message");

const FriendRequest = require("../models/FriendRequest");

exports.getPublicKey = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ publicKey: user.publicKey, displayName: user.displayName, about: user.about });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { displayName, about } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (displayName) user.displayName = displayName;
        if (about) user.about = about;
        await user.save();
        res.json({ message: "Profile updated successfully", user: { username: user.username, displayName: user.displayName, about: user.about } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserProfile = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username }, "username displayName about email isOnline");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("contacts", "username email isOnline displayName about");
        // isOnline logic is handled in frontend via socket usually, but basic data is here
        res.json(user.contacts || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.searchUsers = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    try {
        const currentUser = await User.findById(req.user.id);
        const users = await User.find({
            username: { $regex: query, $options: "i" },
            _id: { $ne: req.user.id, $nin: currentUser.contacts }
        }, "username email displayName about");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendFriendRequest = async (req, res) => {
    const { recipientId } = req.body;
    try {
        const recipient = await User.findById(recipientId);
        if (!recipient) return res.status(404).json({ message: "User not found" });

        const existingRequest = await FriendRequest.findOne({
            sender: req.user.id,
            recipient: recipientId,
            status: "pending"
        });
        if (existingRequest) return res.status(400).json({ message: "Request already sent" });

        const user = await User.findById(req.user.id);
        if (user.contacts.includes(recipientId)) return res.status(400).json({ message: "Already friends" });

        const request = new FriendRequest({
            sender: req.user.id,
            recipient: recipientId
        });
        await request.save();
        res.json({ message: "Friend request sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending"
        }).populate("sender", "username email displayName about").sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.respondToFriendRequest = async (req, res) => {
    const { requestId, status } = req.body; // status: 'accepted' | 'rejected'
    try {
        const request = await FriendRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });
        // Ensure the responder is the recipient
        if (request.recipient.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        request.status = status;
        await request.save();

        if (status === "accepted") {
            await User.findByIdAndUpdate(request.sender, { $addToSet: { contacts: request.recipient } });
            await User.findByIdAndUpdate(request.recipient, { $addToSet: { contacts: request.sender } });
        }

        res.json({ message: `Request ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMessages = async (req, res) => {
    const { username } = req.params;

    try {
        const currentUserDoc = await User.findById(req.user.id);
        if (!currentUserDoc) return res.status(404).json({ message: "Current user not found" });

        const currentUser = currentUserDoc.username;

        const messages = await Message.find({
            $or: [
                { sender: currentUser, recipient: username },
                { sender: username, recipient: currentUser }
            ]
        }).sort({ createdAt: 1 }).populate('replyTo');

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addReaction = async (req, res) => {
    const { messageId, emoji } = req.body;
    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        const currentUser = await User.findById(req.user.id);
        const username = currentUser.username;

        // Check if user already reacted, remove it if same emoji (toggle), or update
        const existingReactionIndex = message.reactions.findIndex(r => r.user === username);

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // Remove reaction
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Update reaction
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ user: username, emoji });
        }

        await message.save();
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
