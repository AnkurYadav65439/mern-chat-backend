import express from 'express'
import userController from '../controllers/UserController.js'
import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

router.post("/register", userController.signup)
router.post("/signin", userController.signin)
router.post("/logout", userController.logout)
router.get("/get",verifyToken, userController.getCurrentUser)

export default router;