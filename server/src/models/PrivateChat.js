import mongoose from 'mongoose';

const PrivateChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true });

export const PrivateChat = mongoose.model('PrivateChat', PrivateChatSchema);