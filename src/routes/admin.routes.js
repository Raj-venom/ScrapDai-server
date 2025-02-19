import { Router } from 'express';
import {
    changeCurrentPassword,
    getCurrentUser,
    loginAdmin,
    logoutAdmin,
    registerAdmin,

} from '../controllers/admin.controller.js';
import { upload } from "../middlewares/multer.middleware.js";
import { USER_ROLE } from "../constants.js";
import { verifyAuthourization } from '../middlewares/auth.middleware.js';



const router = Router();

// POST
router.route('/register').post(registerAdmin);
router.route('/login').post(loginAdmin);
router.route('/logout').post(verifyAuthourization(USER_ROLE.ADMIN), logoutAdmin);
router.route("/change-password").post(verifyAuthourization(USER_ROLE.ADMIN), changeCurrentPassword)

// GET
router.route("/current-user").get(verifyAuthourization(USER_ROLE.ADMIN), getCurrentUser)


export default router