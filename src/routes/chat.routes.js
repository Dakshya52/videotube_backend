import express from 'express';
import { getMessagesByVideo } from '../controllers/chat.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router(); // Apply JWT verification middleware to all routes in this router

// GET /api/chat/:videoId - fetch all messages for a video
router.get('/:videoId', getMessagesByVideo);

export default router;
