const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
    // Example users
    { username: "user1", password: "password1" },
    { username: "user2", password: "password2" }
];

const isValid = (username) => {
    return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!isValid(username)) {
        return res.status(401).json({ message: "Invalid username" });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid password" });
    }

    // Generate a JWT token
    const accessToken = jwt.sign({ username: username }, "access", { expiresIn: '1h' });

    // Save the token in the session
    req.session.authorization = { accessToken };

    return res.status(200).json({ message: "Login successful", token: accessToken });
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;

    if (!review) {
        return res.status(400).json({ message: "Review is required" });
    }

    // Get the username from the session
    const username = req.user.username;

    // Check if the book with the given ISBN exists
    let book = null;
    for (let key in books) {
        if (books[key].isbn == isbn) {
            book = books[key];
            break;
        }
    }

    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Add or modify the review
    book.reviews[username] = review;

    return res.status(200).json({ message: "Review added/modified successfully", reviews: book.reviews });
});

// Add the delete review route
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;

    // Get the username from the session
    const username = req.user.username;

    // Check if the book with the given ISBN exists
    let book = null;
    for (let key in books) {
        if (books[key].isbn == isbn) {
            book = books[key];
            break;
        }
    }

    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the review by this user exists
    if (!book.reviews[username]) {
        return res.status(404).json({ message: "Review not found" });
    }

    // Delete the review
    delete book.reviews[username];

    return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
