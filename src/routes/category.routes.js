import { Router } from 'express';
import {
    addNewCategory,
    getAllCategories,
    getSingleCategory,

} from '../controllers/category.controller.js';

import { upload } from "../middlewares/multer.middleware.js"
import { USER_ROLE } from "../constants.js";
import { verifyAuthourization } from '../middlewares/auth.middleware.js';

const router = Router();


// POST
router.route('/').post(verifyAuthourization(USER_ROLE.ADMIN), upload.single('categoryImage'), addNewCategory);

// GET
router.route('/').get(getAllCategories);
router.route('/:slug').get(getSingleCategory);


export default router