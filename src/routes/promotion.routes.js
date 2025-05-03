import { Router } from 'express';
import {
    createPromotion,
    deletePromotion,
    getActivePromotions,
    getAllPromotions,
    getPromotionById,
    updatePromotion
} from '../controllers/promotion.controller.js';
import { verifyAuthourization } from "../middlewares/auth.middleware.js";
import { USER_ROLE } from '../constants.js';


const router = Router();


router.route('/')
    .post(verifyAuthourization(USER_ROLE.ADMIN), createPromotion)
    .get(getAllPromotions);

router.route('/active').get(getActivePromotions);

router.route('/:id')
    .get(getPromotionById)
    .put(verifyAuthourization(USER_ROLE.ADMIN), updatePromotion)
    .delete(verifyAuthourization(USER_ROLE.ADMIN), deletePromotion);


export default router;