const express = require('express');
const { register, login, logout } = require('../controllers/authControllers');
const { authenticateToken } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/image-upload-middleware'); 
const db = require('../config/db'); 


const router = express.Router();

router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);

router.get('/userprofile', authenticateToken, (req, res) => {
    const { username, email, profile_image: profileImage } = req.user;

    // Construct the full URL for the profile image
    const profileImageUrl = profileImage ? `${req.protocol}://${req.get('host')}/uploads/${profileImage}` : null;

    res.json({ email, username, profileImage: profileImageUrl });
});



module.exports = router;
