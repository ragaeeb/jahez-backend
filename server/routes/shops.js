import express from 'express';
import { doList } from '../controllers/shops.js';
import { validateQuery } from '../middleware/validation.js';

import { asyncHandler } from '../middleware/errorHandler.js';
import { DecimalText, Types } from '../models/schemas.js';

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
            required: ['latitude', 'longitude'],
            type: Types.Object,
            properties: {
                latitude: DecimalText,
                longitude: DecimalText,
            },
        },
    },
};

const router = express.Router();

router.get('/', validateQuery(LookupSchema), asyncHandler(doList));

export default router;
