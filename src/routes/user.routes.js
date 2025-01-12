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
    verifyUserWithOtp,
    cancelAccountDeletion,
    requestAccountDeletion,
    updateUserProfile,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from "../middlewares/multer.middleware.js";

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
router.route("/request-account-deletion").post(verifyJWT, requestAccountDeletion)
router.route("/cancel-account-deletion/:cancelToken?").post(cancelAccountDeletion)

// GET
router.route("/current-user").get(verifyJWT, getCurrentUser)

// patch
router.route("/update-profile").patch(verifyJWT, upload.single("avatar"), updateUserProfile)

export default router 
