import express from 'express';
import { doList } from '../controllers/shops.js';
import { validateQuery } from '../middleware/validation.js';

import { asyncHandler } from '../middleware/errorHandler.js';
import { Types } from '../models/schemas.js';

const LookupSchema = {
    required: ['search_term', 'user_coordinates'],
    properties: {
        category_id: {
            type: Types.Text,
            minLength: 1,
            maxLength: 50,
            pattern: '^-?\\d+$',
        },
        search_term: {
            minLength: 3,
            maxLength: 512,
            type: Types.Text,
        },
        user_coordinates: {
            type: Types.Text,
            pattern: '^[+-]?([0-9]*[.])?[0-9]+,[+-]?([0-9]*[.])?[0-9]+$',
        },
    },
};

const router = express.Router();

router.get('/', validateQuery(LookupSchema), asyncHandler(doList));

export default router;
