const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// POST /auth/register - Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    try {
        // Check if the email is already registered
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if the username is already in use
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Create a new user document
        const newUser = new User({
            username,
            email,
            password, // Password will be hashed before saving in User model's pre-save hook
        });

        // Save the user to database
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// POST /auth/login - Log in and return a JWT token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find the user using their email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the entered password with the hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password); 
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create the payload for the JWT token
        const payload = {
            userId: user._id,
            username: user.username,
            email: user.email,
        };

        // Generate a JWT token with a 7-day expiration
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

module.exports = router;
