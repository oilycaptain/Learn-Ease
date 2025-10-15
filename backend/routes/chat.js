const express = require('express');
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/authMiddleware');
const { Ollama } = require('ollama');

const router = express.Router();
const ollama = new Ollama({ host: 'http://localhost:11434' });

// Get all chats for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ lastActivity: -1 })
      .select('title messages lastActivity createdAt');
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific chat
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user._id
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new chat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const chat = new Chat({
      user: req.user._id,
      title: req.body.title || 'New Chat'
    });
    
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to chat with Ollama
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message
    });

    await chat.save();

    try {
      // Prepare messages for Ollama (convert to the format Ollama expects)
      const ollamaMessages = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response from Ollama with Qwen2.5 model
      const response = await ollama.chat({
        model: 'qwen2.5:1.5b',
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      });

      // Add AI response to chat
      chat.messages.push({
        role: 'assistant',
        content: response.message.content
      });

      // Update chat title if it's the first exchange
      if (chat.messages.length === 2 && chat.title === 'New Chat') {
        const firstMessage = chat.messages[0].content;
        chat.title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
      }

      await chat.save();

      res.json({
        message: response.message.content,
        chat: chat
      });

    } catch (ollamaError) {
      console.error('Ollama error:', ollamaError);
      
      // Fallback response if Ollama fails
      chat.messages.push({
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting to the AI service. Please ensure that Ollama is running with the qwen2.5:1.5b model installed. You can check by running "ollama list" in your terminal.'
      });
      
      await chat.save();
      
      res.status(503).json({ 
        message: 'AI service temporarily unavailable',
        chat: chat
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      user: req.user._id
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update chat title
router.patch('/:chatId/title', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.chatId,
        user: req.user._id
      },
      { title },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;