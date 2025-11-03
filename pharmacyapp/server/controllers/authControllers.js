const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;


exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const profileImage = req.file ? req.file.filename : null;

    try {
        // Check if the user exists
        const [existingUser] = await db.query('SELECT * FROM auth_users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'User already exists. Please login.' });
        }

        // Hash the password and insert into the database
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO auth_users (username, email, password, profile_image) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, profileImage]
        );

        res.status(201).json({ message: 'User registered successfully.', profileImage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};



exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find the user
        const [user] = await db.query('SELECT * FROM auth_users WHERE email = ?', [email]);
        if (!user.length) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Generate a token
        const token = jwt.sign(
            { id: user[0].id, username: user[0].username, email: user[0].email, profile_image: user[0].profile_image },
            SECRET_KEY,
            { expiresIn: '3h' }
        );
        

        res.cookie('token', token, { httpOnly: true }).json({ message: 'Login successful.', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};


exports.logout = (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};



