import { Router } from 'express';
import {
    addNewCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory

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

// PATCH
router.route("/:id").patch(verifyAuthourization(USER_ROLE.ADMIN), upload.single('categoryImage'), updateCategory);


// DELETE
router.route('/:id').delete(verifyAuthourization(USER_ROLE.ADMIN), deleteCategory);


export default router