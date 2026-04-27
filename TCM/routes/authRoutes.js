const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();

// GET CURRENT USER
router.get("/me", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(200).json({
        loggedIn: false,
        user: null,
      });
    }

    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.status(200).json({
        loggedIn: false,
        user: null,
      });
    }

    return res.status(200).json({
      loggedIn: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    req.session.userId = user._id;

    req.session.save((error) => {
      if (error) {
        console.error("Session save error during login:", error);
        return res.status(500).json({ message: "Could not create session" });
      }

      return res.json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// SIGNUP ROUTE
router.post("/signup", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    req.session.userId = newUser._id;

    req.session.save((error) => {
      if (error) {
        console.error("Session save error during signup:", error);
        return res.status(500).json({ message: "Could not create session" });
      }

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGOUT ROUTE
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Could not log out" });
    }

    res.clearCookie("connect.sid");
    return res.json({ message: "Logout successful" });
  });
});

module.exports = router;