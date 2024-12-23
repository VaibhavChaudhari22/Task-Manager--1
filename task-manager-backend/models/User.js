const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');  // Import passport-local-mongoose

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,  // Ensures the username is unique
        trim: true,    // Removes extra spaces from the username
    },
    email: {
        type: String,
        required: true,
        unique: true,  // Ensures the email is unique
        match: /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/, // Validates email format
        lowercase: true, // Converts email to lowercase before saving
        trim: true,      // Trims unnecessary spaces from the email
    },
    password: {
        type: String,
        required: true,
        minlength: 8,  // Minimum password length for better security
    },
});

// Use passport-local-mongoose to add passport methods to your schema
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });  // This enables email login instead of username

module.exports = mongoose.model('User', userSchema);
