import { Router } from 'express';
import {
    changeCurrentPassword,
    loginUser,
    logoutUser,
    registerUser,
    getCurrentUser,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    verifyUserWithOtp
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// POST
router.route('/register').post(registerUser);
router.route('/verify').post(verifyUserWithOtp);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/refresh-access-token").post(refreshAccessToken)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password/:resetToken?").post(resetPassword)

// GET
router.route("/current-user").get(verifyJWT, getCurrentUser)


export default router 
