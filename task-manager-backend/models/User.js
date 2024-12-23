const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,  // Makes sure the username is uniqe
        trim: true, // Removes extra spaces from the username
    },
    email: {
        type: String,
        required: true,
        unique: true,  // Ensures the email is uniqe
        match: /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/, // Validates email format
        lowercase: true, // Converts the email to lowercase before saving
        trim: true, // Trims unnecessary spaces from the email
    },
    password: {
        type: String,
        required: true,
        minlength: 8, // Sets minimum password length for better security
    },
});

// Hash the password before saving it to the database
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) { // Only hash if the password is modified
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
    }
    next();
});

// Compares the entered password with the hashed one in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password); // Return true if passwords match
};

module.exports = mongoose.model('User', userSchema);
