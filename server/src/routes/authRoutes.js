import express from 'express';
import AuthService from '../services/authService.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

// Middleware to verify token

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Token:", token);
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await AuthService.verifyToken(token);
    console.log("Decoded User:", user);  // Debugging

    if (!user || !user._id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = { ...user, id: user._id.toString() };  // Ensure `id` is set
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};



// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     console.log(token);
    
    
//     if (!token) {
//       return res.status(401).json({ message: 'No token provided' });
//     }

//     const user = await AuthService.verifyToken(token);
//     console.log("abc", user);
    
//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Unauthorized' });
//   }
// };

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    const result = await AuthService.register({
      name,
      username,
      email,
      password
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    const result = await AuthService.login(identifier, password);

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ 
      message: error.message 
    });
  }
});

// Get Current User
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json(req.user);
});

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { name, avatar }, 
      { new: true }
    );

    res.status(200).json(User.sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ 
      message: error.message 
    });
  }
});

export default router;
export { authMiddleware };