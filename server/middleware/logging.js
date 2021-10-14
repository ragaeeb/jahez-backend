import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { getAuditDB } from '../utils/db.js';

export const logStep = (req, id) => {
    logger.info(id, req.requestId);
};

export const signRequest = (req, _, next) => {
    req.requestId = crypto.randomBytes(6).toString('hex');
    logStep(req, 'signRequest');

    next();
};

export const logRequestForAuditing = async (req, _, next) => {
    logStep(req, 'logRequestForAuditing');
    const logStatement = await getAuditDB().prepare('INSERT INTO logs (request) VALUES (?)');
    logStatement.bind(JSON.stringify({ url: req.url }));
    logStatement.run();

    next();
};
