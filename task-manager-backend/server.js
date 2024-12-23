if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Connect to database
const authRoutes = require('./routes/auth'); // Auth routes
const taskRoutes = require('./routes/tasks'); // Task routes
const errorHandler = require('./middleware/error'); // Error handler middleware

const passport = require('passport'); // Import passport
const User = require('./models/User'); // Import User model for passport
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");

const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse incoming JSON requests

const store = MongoStore.create({
    mongoUrl: process.env.ATLASDB_URL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

// Session Options
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Passport LocalStrategy Setup
passport.use(new LocalStrategy(User.authenticate())); // Use User's authenticate method

passport.serializeUser(User.serializeUser()); // Serialize the user
passport.deserializeUser(User.deserializeUser()); // Deserialize the user

// Flash messages middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Define routes
app.use('/api/auth', authRoutes); // Auth routes
app.use('/api/tasks', taskRoutes); // Task routes

// Error handling middleware
app.use(errorHandler); // Handle errors

// Start server
const PORT = process.env.PORT || 5000; // Default to 5000 if no port specified
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
