import { init, connectToDB } from './server/app.js';

const app = init();
connectToDB(app);
