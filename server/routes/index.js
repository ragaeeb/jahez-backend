import shops from './shops.js';
import { signRequest, logRequestForAuditing } from '../middleware/logging.js';

const attachRoutes = (app) => {
    app.use(signRequest, logRequestForAuditing);
    app.use('/api/v1/shops', shops);
};

export default attachRoutes;
