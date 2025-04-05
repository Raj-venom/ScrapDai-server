import { Router } from 'express';
import { verifyAuthourization } from '../middlewares/auth.middleware.js';
import { collectorStats, userStats, getCollectionOverview, getDashboardStats } from '../controllers/dashboard.controller.js';
import { USER_ROLE } from '../constants.js';


const router = Router();


// GET
router.route('/user-stats').get(verifyAuthourization(USER_ROLE.USER), userStats);
router.route('/collector-stats').get(verifyAuthourization(USER_ROLE.COLLECTOR), collectorStats);

router.route('/admin-dashboard-stats').get(verifyAuthourization(USER_ROLE.ADMIN), getDashboardStats);

router.get("/collection-overview", verifyAuthourization(USER_ROLE.ADMIN), getCollectionOverview);



export default router
