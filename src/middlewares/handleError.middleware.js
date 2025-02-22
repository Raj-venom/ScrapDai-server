import { ApiError } from "../utils/ApiError.js"

export const handleError = (err, req, res, next) => {

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: false
        });
    }


    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON syntax',
            // errors: err.message
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.errors[Object.keys(err.errors)[0]].message,
            // errors: err.errors
        });
    }

    if (err.name === 'MongoServerError' && err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate key error',
            errors: err.keyValue
        });
    }

    // MulterError
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message,
            errors: err
        });
    }

    if (err.errors) {
        return res.status(400).json({
            success: false,
            message: err.errors[Object.keys(err.errors)[0]].message,
            errors: err.errors
        });
    }

    if (err.name) {
        return res.status(500).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    if (err.errors) {
        return res.status(400).json({
            success: false,
            message: err.errors[Object.keys(err.errors)[0]].message,
            // errors: err.errors
        });
    }



    return res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
    });
};

