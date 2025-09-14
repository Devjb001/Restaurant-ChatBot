const express = require('express');
const { handleChat } = require('../controllers/ChatController');

const router = express.Router();

router.post('/chat', handleChat);

module.exports = router;s