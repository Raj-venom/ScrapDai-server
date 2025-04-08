import express from "express";
import {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyJWT);

router.route("/")
    .post(createNotification)
    .get(getNotifications);

router.route("/:notificationId/read")
    .patch(markAsRead);

router.route("/:notificationId")
    .delete(deleteNotification);

export default router;