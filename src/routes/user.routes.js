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
    getAllUsers,
} from '../controllers/user.controller.js';
import { verifyJWT, verifyAuthourization } from '../middlewares/auth.middleware.js';
import { upload } from "../middlewares/multer.middleware.js";
import { USER_ROLE } from "../constants.js";

const router = Router();

// POST
router.route('/register').post(registerUser);
router.route('/verify').post(verifyUserWithOtp);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyAuthourization(USER_ROLE.USER), logoutUser);
router.route("/change-password").post(verifyAuthourization(USER_ROLE.USER), changeCurrentPassword)
router.route("/refresh-access-token").post(refreshAccessToken)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password/:resetToken?").post(resetPassword)
router.route("/request-account-deletion").post(verifyAuthourization(USER_ROLE.USER), requestAccountDeletion)
router.route("/cancel-account-deletion/:cancelToken?").post(cancelAccountDeletion)

// GET
router.route("/current-user").get(verifyAuthourization(USER_ROLE.USER), getCurrentUser)
router.route("/all").get(getAllUsers)

// patch
router.route("/update-profile").patch(verifyAuthourization(USER_ROLE.USER), updateUserProfile)

export default router 
