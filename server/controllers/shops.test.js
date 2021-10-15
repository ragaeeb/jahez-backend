import faker from 'faker';
import { GeoPosition } from 'geo-position.ts';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InvalidParams } from '../middleware/errorHandler.js';
import { logStep } from '../middleware/logging.js';
import { getMasterDB } from '../utils/db.js';
import { doList, validateCoordinates } from './shops.js';

jest.mock('../middleware/errorHandler.js');
jest.mock('../middleware/logging.js');
jest.mock('../utils/db.js');

describe('shops', () => {
    let statement;
    let masterDB;
    let req;
    let res;
    let next;

    const mockDB = (resultSet = []) => {
        statement = {
            all: jest.fn(() => resultSet),
            bind: jest.fn(),
            finalize: jest.fn(),
        };

        masterDB = { prepare: jest.fn(() => statement) };
        getMasterDB.mockReturnValue(masterDB);
    };

    beforeEach(() => {
        req = {
            query: {},
        };

        res = {
            json: jest.fn().mockReturnThis(),
        };

        next = jest.fn();

        mockDB();
    });

    afterEach(jest.clearAllMocks);

    describe('validateCoordinates', () => {
        it('should log the hit to the middleware', () => {
            req.query.user_coordinates = '123,150';

            validateCoordinates(req, res, next);

            expect(logStep).toHaveBeenCalledTimes(1);
        });

        it('should reject invalid geo coordinates', () => {
            InvalidParams.mockImplementation((s) => s);

            req.query.user_coordinates = `-45666.40,45.1233`;

            validateCoordinates(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith('Geographical coordinates are not valid');
        });

        it('should accept valid geo coordinates', () => {
            InvalidParams.mockImplementation((s) => s);

            req.query.user_coordinates = `45.123,-76.123`;

            validateCoordinates(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('doList', () => {
        it('should log the hit to the middleware', async () => {
            await doList(req, res, next);

            expect(logStep).toHaveBeenCalledTimes(1);
        });

        it('should query the database without the category', async () => {
            const searchQuery = faker.name.firstName();
            req.query.search_term = searchQuery;
            await doList(req, res, next);

            expect(masterDB.prepare).toHaveBeenCalledTimes(1);
            expect(masterDB.prepare).toHaveBeenCalledWith(
                'SELECT s.id,b.id AS branchId,p.id AS productId,s.name AS shopName,s.schedule,latitude,longitude,b.name AS branchName,p.name AS productName FROM shops s INNER JOIN products p ON p.shop=s.id INNER JOIN branches b ON b.shop=s.id WHERE (p.name LIKE ? OR s.name LIKE ?)',
            );
            expect(statement.bind).toHaveBeenCalledTimes(1);
            expect(statement.bind).toHaveBeenCalledWith(`%${searchQuery}%`, `%${searchQuery}%`);
            expect(statement.all).toHaveBeenCalledTimes(1);
            expect(statement.finalize).toHaveBeenCalledTimes(1);
        });

        it('should query the database with the category', async () => {
            const searchQuery = faker.name.firstName();
            req.query.search_term = searchQuery;
            req.query.category_id = faker.datatype.number({ min: 1 }).toString();
            await doList(req, res, next);

            expect(masterDB.prepare).toHaveBeenCalledTimes(1);
            expect(masterDB.prepare).toHaveBeenCalledWith(
                'SELECT s.id,b.id AS branchId,p.id AS productId,s.name AS shopName,s.schedule,latitude,longitude,b.name AS branchName,p.name AS productName FROM shops s INNER JOIN products p ON p.shop=s.id INNER JOIN branches b ON b.shop=s.id INNER JOIN shop_categories sc ON sc.shop=s.id INNER JOIN product_categories pc ON pc.product=p.id WHERE (p.name LIKE ? OR s.name LIKE ?) AND (pc.category=? OR sc.category=?)',
            );
            expect(statement.bind).toHaveBeenCalledTimes(1);
            expect(statement.bind).toHaveBeenCalledWith(
                `%${searchQuery}%`,
                `%${searchQuery}%`,
                req.query.category_id,
                req.query.category_id,
            );
            expect(statement.all).toHaveBeenCalledTimes(1);
            expect(statement.finalize).toHaveBeenCalledTimes(1);
        });

        it('should show open branch', async () => {
            const latitude = 100.5;
            const longitude = -75.5;
            req.userLocation = new GeoPosition(latitude, longitude);
            req.timestamp = new Date(2020, 6, 6, 16, 17, 0); // monday july 6, 2020, 4:17pm

            const result = {
                id: faker.datatype.number({ min: 1 }),
                branchId: faker.datatype.number({ min: 1 }),
                branchName: faker.name.lastName(),
                latitude,
                longitude,
                productId: faker.datatype.number({ min: 1 }),
                productName: faker.name.jobTitle(),
                schedule: 'Mo 06:00-16:30',
                shopName: faker.name.firstName(),
            };

            mockDB([result]);

            await doList(req, res, next);

            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                data: {
                    shops: [
                        {
                            id: result.id.toString(),
                            name: result.shopName,
                            branches: [
                                {
                                    id: result.branchId.toString(),
                                    isOpen: true,
                                    latitude,
                                    longitude,
                                    name: result.branchName,
                                },
                            ],
                            products: [{ id: result.productId.toString(), name: result.productName }],
                        },
                    ],
                },
            });
        });

        it('should show closed branch', async () => {
            const latitude = 100.5;
            const longitude = -75.5;
            req.userLocation = new GeoPosition(latitude, longitude);
            req.timestamp = new Date(2020, 6, 6, 16, 31, 0); // monday july 6, 2020, 4:31pm

            const result = {
                id: faker.datatype.number({ min: 1 }),
                branchId: faker.datatype.number({ min: 1 }),
                branchName: faker.name.lastName(),
                latitude,
                longitude,
                productId: faker.datatype.number({ min: 1 }),
                productName: faker.name.jobTitle(),
                schedule: 'Mo 06:00-16:30',
                shopName: faker.name.firstName(),
            };

            mockDB([result]);

            await doList(req, res, next);

            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                data: {
                    shops: [
                        {
                            id: result.id.toString(),
                            name: result.shopName,
                            branches: [
                                {
                                    id: result.branchId.toString(),
                                    isOpen: false,
                                    latitude,
                                    longitude,
                                    name: result.branchName,
                                },
                            ],
                            products: [{ id: result.productId.toString(), name: result.productName }],
                        },
                    ],
                },
            });
        });

        it('should show result since store is still within range', async () => {
            const latitude = 45.5;
            const longitude = -75.5;
            req.userLocation = new GeoPosition(latitude, longitude);
            req.timestamp = new Date();

            mockDB([
                {
                    id: faker.datatype.number({ min: 1 }),
                    branchId: faker.datatype.number({ min: 1 }),
                    branchName: faker.name.lastName(),
                    latitude: 45.47,
                    longitude: -75.47,
                    productId: faker.datatype.number({ min: 1 }),
                    productName: faker.name.jobTitle(),
                    schedule: 'Mo 06:00-16:30',
                    shopName: faker.name.firstName(),
                },
            ]);

            await doList(req, res, next);

            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                data: {
                    shops: [expect.any(Object)],
                },
            });
        });

        it('should not show result since store is outside of range', async () => {
            const latitude = 45.5;
            const longitude = -75.5;
            req.userLocation = new GeoPosition(latitude, longitude);
            req.timestamp = new Date();

            mockDB([
                {
                    id: faker.datatype.number({ min: 1 }),
                    branchId: faker.datatype.number({ min: 1 }),
                    branchName: faker.name.lastName(),
                    latitude: 45.45,
                    longitude: -75.45,
                    productId: faker.datatype.number({ min: 1 }),
                    productName: faker.name.jobTitle(),
                    schedule: 'Mo 06:00-16:30',
                    shopName: faker.name.firstName(),
                },
            ]);

            await doList(req, res, next);

            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                data: {
                    shops: [],
                },
            });
        });
    });
});
