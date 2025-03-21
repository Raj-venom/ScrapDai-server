import { Router } from 'express';
import { verifyAuthourization } from '../middlewares/auth.middleware.js';
import { userStats } from '../controllers/dashboard.controller.js';
import { USER_ROLE } from '../constants.js';


const router = Router();


// GET
router.route('/user-stats').get(verifyAuthourization(USER_ROLE.USER), userStats);


export default router
