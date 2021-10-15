import faker from 'faker';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { validate } from './validation.js';
import { InvalidParams } from './errorHandler.js';

jest.mock('./errorHandler.js');
jest.mock('../utils/logger.js');

describe('validation', () => {
    let req;
    let next;

    beforeEach(() => {
        req = {
            query: {},
        };

        next = jest.fn();
    });

    afterEach(jest.clearAllMocks);

    it('should validate entire request', () => {
        req = { name: faker.name.firstName() };
        validate({ type: 'object', properties: { name: { type: 'string' } } }, null)(req, null, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it('should reject if entire request is not properly formatted', () => {
        InvalidParams.mockImplementation((s) => s);

        req = { name: faker.datatype.number() };
        validate({ type: 'object', properties: { name: { type: 'string' } } }, null)(req, null, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith('must be string');
    });

    describe('error case', () => {
        it('should throw an error for invalid schemas', () => {
            expect(() => validate({ something: faker.datatype.uuid(), type: faker.datatype.uuid() })()).toThrow();
        });
    });
});
