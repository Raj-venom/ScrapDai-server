import { Router } from 'express';
import {
    changeCurrentPassword,
    loginUser,
    logoutUser,
    registerUser,
    verifyOtp,
    getCurrentUser,
    refreshAccessToken
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// POST
router.route('/register').post(registerUser);
router.route('/verify-otp').post(verifyOtp);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/refresh-access-token").post(refreshAccessToken)

// GET
router.route("/current-user").get(verifyJWT, getCurrentUser)


export default router 
