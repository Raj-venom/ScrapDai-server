import { Router } from 'express';

import {
    upsertFeedback,
    getAllFeedback,
    getFeedbackById,
    deleteFeedback,
    getFeedbackByOrderId,
    getAllFeedbackOfCollector,
    getAllFeedbackOfUser

} from '../controllers/feedback.controller.js';

import { verifyAuthourization } from '../middlewares/auth.middleware.js';
import { USER_ROLE } from '../constants.js';


const router = Router();


// POST
router.route("/upsert/user/:orderId").post(verifyAuthourization(USER_ROLE.USER), upsertFeedback)
router.route("/upsert/collector/:orderId").post(verifyAuthourization(USER_ROLE.COLLECTOR), upsertFeedback)

// GET
router.route("/all").get(verifyAuthourization(USER_ROLE.ADMIN), getAllFeedback)
router.route("/all/collector/:collectorId").get(verifyAuthourization(USER_ROLE.ADMIN), getAllFeedbackOfCollector)
router.route("/all/user/:userId").get(verifyAuthourization(USER_ROLE.ADMIN), getAllFeedbackOfUser)
router.route("/:id").get(getFeedbackById)
router.route("/order/:orderId").get(getFeedbackByOrderId)

// DELETE
router.route("/:id").delete(verifyAuthourization(USER_ROLE.ADMIN), deleteFeedback)


export default router;






