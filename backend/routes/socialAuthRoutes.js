import express from 'express';
import { googleLogin, facebookLogin } from '../controllers/socialAuthController.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);

export default router;
