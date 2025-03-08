import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';


class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate token
      const token = user.generateToken();

      return {
        user: User.sanitizeUser(user),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  async login(identifier, password) {
    try {
      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Update online status
      user.online = true;
      user.lastActive = new Date();
      await user.save();

      // Generate token
      const token = user.generateToken();

      return {
        user: User.sanitizeUser(user),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify JWT token


  async verifyToken(token) {
    try {
      console.log("Token received:", token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded Token:", decoded);
  
      const user = await User.findById(decoded.id);
      // console.log("User found:", user);
      
      if (!user) {
        throw new Error('User not found');
      }
  
      return User.sanitizeUser(user);
    } catch (error) {
      console.error("Token verification error:", error.message);
      throw new Error('Invalid or expired token');
    }
  }
  


//   async verifyToken(token) {
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id);
//       console.log(user);
      
      
//       if (!user) {
//         throw new Error('User not found');
//       }

//       return User.sanitizeUser(user);
//     } catch (error) {
//       throw new Error('Invalid or expired token');
//     }
//   }



}

export default new AuthService();