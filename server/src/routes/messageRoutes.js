import express from 'express';
import { authMiddleware } from './authRoutes.js';
import MessageService from '../services/messageService.js';
import { Group } from '../models/Group.js';
import { PrivateChat } from '../models/PrivateChat.js';

const router = express.Router();

// Create a new group
router.post('/groups', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate, members } = req.body;
    
    const group = new Group({
      name,
      description,
      creator: req.user.id,
      members: [req.user.id, ...members],
      admins: [req.user.id],
      isPrivate
    });

    await group.save();

    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's groups
router.get('/groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id
    }).populate('lastMessage');

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get group messages
router.get('/groups/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await MessageService.getGroupMessages(
      groupId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get or create private chat
router.get('/private/:recipientId', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.params;

    // Find or create private chat
    let privateChat = await PrivateChat.findOne({
      participants: { $all: [req.user.id, recipientId] }
    }).populate('lastMessage');

    if (!privateChat) {
      privateChat = new PrivateChat({
        participants: [req.user.id, recipientId]
      });
      await privateChat.save();
    }

    res.status(200).json(privateChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get private chat messages
router.get('/private/:recipientId/messages', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Find or create private chat
    let privateChat = await PrivateChat.findOne({
      participants: { $all: [req.user.id, recipientId] }
    });

    if (!privateChat) {
      privateChat = new PrivateChat({
        participants: [req.user.id, recipientId]
      });
      await privateChat.save();
    }

    const messages = await MessageService.getPrivateChatMessages(
      privateChat._id, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;