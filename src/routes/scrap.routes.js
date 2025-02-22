import { Router } from 'express';
import {
    addNewScrap,
    deleteScrap,
    updateScrapPrice,
    getAllScraps,
    getScrapById,
    updatedMultipleScrapPrice,
    getAllScrapsPrice,
    updateScrapDetails
} from '../controllers/scrap.controller.js';
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

// POST
router.route('/').post(upload.single('ScrapImage'), addNewScrap);

// GET
router.route('/').get(getAllScraps);
router.route("/:id").get(getScrapById);
router.route('/all/prices').get(getAllScrapsPrice);

// DELETE
router.route('/:id').delete(deleteScrap);

// PATCH
router.route('/:id').patch(updateScrapPrice);
router.route('/all/update-multiple').patch(updatedMultipleScrapPrice);
router.route('/update/:id').patch(upload.single('ScrapImage'), updateScrapDetails);


export default router