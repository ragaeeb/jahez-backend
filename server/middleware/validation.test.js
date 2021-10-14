/* eslint-disable jest/expect-expect */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "validate*"] }] */

import faker from 'faker';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { validate } from './validation.js';
import { ValidationTest } from '../../testingUtils.js';

jest.mock('../utils/logger.js');

describe('validation', () => {
    let vt;

    beforeEach(() => {
        vt = new ValidationTest();
    });

    it('should validate entire request', () => {
        vt.req = { name: faker.name.firstName() };
        validate({ type: 'object', properties: { name: { type: 'string' } } }, null)(vt.req, null, vt.next);
        vt.validateResult();
    });

    it('should reject if entire request is not properly formatted', () => {
        vt.req = { name: faker.datatype.number() };
        validate({ type: 'object', properties: { name: { type: 'string' } } }, null)(vt.req, null, vt.next);
        vt.validateResult('must be string');
    });

    describe('error case', () => {
        it('should throw an error for invalid schemas', () => {
            expect(() => validate({ something: faker.datatype.uuid(), type: faker.datatype.uuid() })()).toThrow();
        });
    });
});
