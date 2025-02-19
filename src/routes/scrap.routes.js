import { Router } from 'express';
import{
    addNewScrap,
    deleteScrap,
    updateScrapPrice,
} from '../controllers/scrap.controller.js';
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();


router.route('/').post(upload.single('ScrapImage'), addNewScrap);
router.route('/:id').delete(deleteScrap);
router.route('/:id').patch(updateScrapPrice);


export default router