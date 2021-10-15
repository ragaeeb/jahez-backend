import faker from 'faker';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InternalError, InvalidParams, NotFound, catchError, routeNotFound } from './errorHandler.js';

jest.mock('../utils/logger.js');

describe('errorHandler', () => {
    describe('common errors', () => {
        Object.entries({ 400: InvalidParams, 404: NotFound, 500: InternalError }).forEach(([code, f]) => {
            it(`should throw ${code}`, () => {
                const message = faker.lorem.sentence();
                const result = f(message);
                expect(result).toBeInstanceOf(Error);
                expect(result.status).toEqual(Number(code));
                expect(result.toString()).toEqual(`Error: ${message}`);
            });
        });
    });

    describe('routeNotFound', () => {
        it('should process route not found', () => {
            const next = jest.fn();
            routeNotFound(null, null, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith(new Error(`Route not found`));
        });
    });

    describe('catchError', () => {
        let req;

        beforeEach(() => {
            req = jest.fn();
        });

        it('should respond with an error', () => {
            const json = jest.fn();
            const res = { status: jest.fn(() => ({ json })) };
            const err = {
                stack: faker.lorem.sentence(),
                status: faker.datatype.number(),
                message: faker.lorem.sentence(),
            };
            catchError(err, req, res);
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(err.status);

            expect(json).toHaveBeenCalledTimes(1);
            expect(json).toHaveBeenCalledWith({ success: false, error: err.message });
        });

        it('should use internal error if a status is not explicitly given', () => {
            const res = { status: jest.fn(() => ({ json: jest.fn() })) };
            const err = {
                stack: faker.lorem.sentence(),
                message: faker.lorem.sentence(),
            };
            catchError(err, req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
