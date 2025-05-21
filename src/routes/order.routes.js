import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    acceptOrder,
    completeOrder,
    cancelOrder,
    getCollectorsPendingOrders,
    placeOrder,
    getNewOrderRequest,
    getNearbyOrders,
    getAllPendingOrders,
    getHighValueOrders,
    getOrderScheduledForToday,
    getCollectorsOrdersHistory,
    getCollectorOrderHistoryById,
    getUserOrderHistoryById,
    updateOrderScheduledDate

} from '../controllers/order.controller.js';

import { verifyAuthourization } from '../middlewares/auth.middleware.js';
import { USER_ROLE } from '../constants.js';
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

// POST
router.route('/')
    .post(
        verifyAuthourization(USER_ROLE.USER),
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

// NOTE: Old API not in used 
router.route('/place-order').post(verifyAuthourization(USER_ROLE.USER), placeOrder);


// GET
router.route('/my-orders').get(verifyAuthourization(USER_ROLE.USER), getMyOrders); // User's orders History
router.route('/collectors-orders-history').get(verifyAuthourization(USER_ROLE.COLLECTOR), getCollectorsOrdersHistory);

router.route('/collector-orders-history/:id').get(verifyAuthourization(USER_ROLE.ADMIN), getCollectorOrderHistoryById);
router.route('/user-order-history/:id').get(verifyAuthourization(USER_ROLE.ADMIN), getUserOrderHistoryById);


router.route('/new-order-request').get(verifyAuthourization(USER_ROLE.COLLECTOR), getNewOrderRequest);
router.route('/collector-orders').get(verifyAuthourization(USER_ROLE.COLLECTOR), getCollectorsPendingOrders);
router.route('/nearby-orders').get(verifyAuthourization(USER_ROLE.COLLECTOR), getNearbyOrders);
router.route('/pending-orders').get(verifyAuthourization(USER_ROLE.COLLECTOR), getAllPendingOrders);
router.route('/high-value-orders').get(verifyAuthourization(USER_ROLE.COLLECTOR), getHighValueOrders);
router.route('/today-orders').get(verifyAuthourization(USER_ROLE.COLLECTOR), getOrderScheduledForToday);

router.route('/:id').get(getOrderById);


// patch
router.route('/:id/complete').patch(verifyAuthourization(USER_ROLE.COLLECTOR), completeOrder);
router.route('/:id/accept').patch(verifyAuthourization(USER_ROLE.COLLECTOR), acceptOrder);

router.route('/:id/cancel').patch(verifyAuthourization(USER_ROLE.USER), cancelOrder);
router.route('/:id/update-scheduled-date').patch(verifyAuthourization(USER_ROLE.USER), updateOrderScheduledDate);


export default router;