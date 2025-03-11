import { Router } from 'express';
import {
    changeCurrentPassword,
    getAllCollectors,
    getCurrentUser,
    loginCollector,
    logoutCollector,
    registerCollector,
    refereshAccessToken

} from '../controllers/collector.controller.js';
import { USER_ROLE } from "../constants.js";
import { verifyAuthourization } from '../middlewares/auth.middleware.js';

const router = Router();

// Admin Routes 
router.route('/register').post(verifyAuthourization(USER_ROLE.ADMIN), registerCollector);


// POST
router.route('/login').post(loginCollector);
router.route('/logout').post(verifyAuthourization(USER_ROLE.COLLECTOR), logoutCollector);
router.route("/change-password").post(verifyAuthourization(USER_ROLE.COLLECTOR), changeCurrentPassword)
router.route("/refresh-access-token").post(refereshAccessToken)

// Get
router.route("/current-user").get(verifyAuthourization(USER_ROLE.COLLECTOR), getCurrentUser)
router.route("/all").get(getAllCollectors)

export default router