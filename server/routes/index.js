import shops from './shops.js';

const attachRoutes = (app) => {
    app.use('/api/v1/shops', shops);
};

export default attachRoutes;
