import dotenv from 'dotenv';
import express, { json } from 'express';
import morgan from 'morgan';
import { catchError, routeNotFound } from './middleware/errorHandler.js';
import { openAuditDB, openMasterDB } from './utils/db.js';
import { logger } from './utils/logger.js';
import attachRoutes from './routes/index.js';

export const init = () => {
    dotenv.config();

    const { NODE_ENV: env } = process.env;

    global.isDev = env === 'development';
    global.isProd = env === 'production';
    global.isTest = env === 'test';

    const app = express();
    app.use(morgan(global.isDev ? 'dev' : 'tiny'));
    app.use(json());

    logger.info('NODE_ENV', env);

    attachRoutes(app);

    if (global.isProd) {
        app.get('*', (req, _, next) => {
            if (req.url.startsWith('/api')) {
                return next();
            }

            return null;
        });
    } else {
        logger.info('Falling back');
        app.get('/', (_, res) => res.send('API is running...'));
    }

    app.use(routeNotFound);
    app.use(catchError);

    return app;
};

export const connectToDB = async (app) => {
    try {
        const { PORT, NODE_ENV, AUDIT_DB_PATH, DB_PATH } = process.env;

        await Promise.all([openMasterDB(DB_PATH), openAuditDB(AUDIT_DB_PATH)]);

        logger.info('Connected to databases');

        if (!global.isTest) {
            const port = PORT || 5000;
            app.listen(port, () => {
                logger.info(`Server running in ${NODE_ENV} mode on port ${port}`);
            });
        }
    } catch (error) {
        logger.error(`Error during init: ${error}`);
    }
};

export default init;
