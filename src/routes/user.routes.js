import { Router } from 'express';
import {
    registerUser,
    verifyOtp,

} from '../controllers/user.controller.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/verify-otp').post(verifyOtp);


export default router 
