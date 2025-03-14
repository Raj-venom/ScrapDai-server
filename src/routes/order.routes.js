import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    getUnassignedOrders,
    getOderById,
    acceptOrder,
    completeOrder,
    cancelOrder,
    getCollectorsPendingOrders

} from '../controllers/order.controller.js';

import { verifyAuthourization } from '../middlewares/auth.middleware.js';
import { USER_ROLE } from '../constants.js';
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

// POST
router.route('/')
    .post(
        verifyAuthourization([USER_ROLE.USER]),
        upload.fields(
            [
                {
                    name: "scrapImages",
                    maxCount: 4
                }
            ]
        ),
        createOrder

    );


// GET
router.route('/my-orders').get(verifyAuthourization([USER_ROLE.USER]), getMyOrders);
router.route('/unassigned-orders').get(verifyAuthourization([USER_ROLE.COLLECTOR]), getUnassignedOrders);
router.route('/collector-orders').get(verifyAuthourization([USER_ROLE.COLLECTOR]), getCollectorsPendingOrders);
router.route('/:id').get(getOderById);


// patch
router.route('/:id/complete').patch(verifyAuthourization([USER_ROLE.COLLECTOR]), completeOrder);
router.route('/:id/cancel').patch(verifyAuthourization([USER_ROLE.USER]), cancelOrder);
router.route('/:id/accept').patch(verifyAuthourization([USER_ROLE.COLLECTOR]), acceptOrder);