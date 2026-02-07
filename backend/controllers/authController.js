const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password, publicKey, encryptedPrivateKey } = req.body;

  try {
    const userExists = await User.findOne({ username }); // Check by username too
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword, publicKey, encryptedPrivateKey });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  console.log("Login attempt:", req.body);
  const { username, password } = req.body;

  try {
    // metadata: Checking if user exists by username OR email
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }]
    });
    console.log("User search result for", username, ":", user ? "Found" : "Not Found");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        encryptedPrivateKey: user.encryptedPrivateKey
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
