const User = require("../models/User");
const Message = require("../models/Message");

exports.getPublicKey = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ publicKey: user.publicKey });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, "username email");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

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
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
