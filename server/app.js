import compression from 'compression';
import dotenv from 'dotenv';
import express, { json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import xss from 'xss-clean';
import { catchError, routeNotFound } from './middleware/errorHandler.js';
import { limit } from './utils/security.js';
import { logger } from './utils/logger.js';
import attachRoutes from './routes/index.js';

export const init = () => {
    dotenv.config();

    const { NODE_ENV: env, LOG: forceLog } = process.env;

    global.isDev = env === 'development';
    global.isProd = env === 'production';
    global.isTest = env === 'test';

    const app = express();

    app.use(morgan(global.isDev ? 'dev' : 'tiny', { skip: () => global.isTest && !forceLog }));
    app.use(
        json({
            limit: '300kb',
        }),
    ); // maximum 300kb of payload will be accepted
    app.use(urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
    app.use(
        helmet.contentSecurityPolicy({
            useDefaults: true,
            directives: {
                'img-src': ["'self'", 'https://*'],
            },
        }),
    );
    app.use(compression());
    app.use(xss()); // prevent xss attacks
    app.use(hpp());
    limit(app);

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
        const { PORT, NODE_ENV } = process.env;

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
