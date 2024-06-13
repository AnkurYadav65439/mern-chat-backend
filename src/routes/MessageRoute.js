import express from 'express'
import messageController from '../controllers/MessageController.js';
import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

router.get("/:id",verifyToken, messageController.getMessages);

export default router;