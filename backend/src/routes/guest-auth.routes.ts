import express from 'express';
import { GuestAuthController } from '../controllers/guest-auth.controller';
import { authenticateOrGuest } from '../middleware/guest-auth.middleware';

const router = express.Router();
const controller = new GuestAuthController();

/**
 * @route   POST /api/auth/guest-token
 * @desc    Create a new guest session and get a guest token
 * @access  Public
 */
router.post('/guest-token', controller.createGuestSession);

/**
 * @route   GET /api/auth/guest-status
 * @desc    Get the current status of a guest session
 * @access  Guest (requires guest token)
 */
router.get('/guest-status', authenticateOrGuest, controller.getGuestStatus);

export default router;
