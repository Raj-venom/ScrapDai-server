import { Router } from 'express';

import {
    getTopCollectors,
    getTopScrapSeller,
} from '../controllers/analytics.controller.js';

import { USER_ROLE } from "../constants.js";
import { verifyAuthourization } from '../middlewares/auth.middleware.js';


const router = Router();

// GET
router.route('/top-scrap-seller').get(getTopScrapSeller);
router.route('/top-collectors').get(getTopCollectors);


export default router;