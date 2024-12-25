import { Router } from 'express';
import {
    changeCurrentPassword,
    loginUser,
    logoutUser,
    registerUser,
    verifyOtp,

} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/verify-otp').post(verifyOtp);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword)


export default router 
