import cors from 'cors';
import rateLimit from 'express-rate-limit';

export const activateCORS = (app) => {
    app.use(cors());
};

export const limit = (app) => {
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // for a window of 15 mins
            max: 100, // a maximum of 100 requests can be made per IP
        }),
    );
};
