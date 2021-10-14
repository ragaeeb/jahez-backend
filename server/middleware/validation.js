import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { InvalidParams } from './errorHandler.js';
import { logger } from '../utils/logger.js';
import { Types } from '../models/schemas.js';
import { logStep } from './logging.js';

// eslint-disable-next-line new-cap
const ajv = Ajv.default ? new Ajv.default({ coerceTypes: false }) : new Ajv({ coerceTypes: false });
addFormats(ajv);

export const validate =
    (schema, field = 'body') =>
    (req, _, next) => {
        logStep(req, 'middleware/validation::validate');

        try {
            const validator = ajv.compile({ type: Types.Object, additionalProperties: false, ...schema });
            logger.verbose('schema', schema);
            logger.verbose(`req[${field}]`, field ? req[field] : req);

            if (!validator(field ? req[field] : req)) {
                const [error] = validator.errors;
                return next(InvalidParams(`${error.dataPath ? `${error.dataPath} ` : ''}${error.message}`));
            }

            return next();
        } catch (err) {
            logger.error('schema', schema);
            throw err;
        }
    };

export const validateQuery = (schema) => validate(schema, 'query');
