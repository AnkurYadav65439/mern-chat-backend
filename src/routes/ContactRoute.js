import express from "express";
import { verifyToken } from "../utils/verifyToken.js";
import contactController from '../controllers/ContactController.js'

const router = express.Router();

router.get('/', verifyToken, contactController.getAllContacts);

export default router;