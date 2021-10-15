import Database from 'sqlite-async';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getAuditDB, getMasterDB, openAuditDB, openMasterDB } from './db.js';

jest.mock('sqlite-async');

describe('db', () => {
    let client;

    beforeEach(() => {
        client = {
            close: jest.fn(),
        };

        Database.open.mockResolvedValue(client);
    });

    afterEach(jest.clearAllMocks);

    Object.entries({
        openAuditDB: { open: openAuditDB, get: getAuditDB },
        openMasterDB: { open: openMasterDB, get: getMasterDB },
    }).forEach(([key, { open, get }]) => {
        describe(`${key}`, () => {
            it('should return the same reference when called again', async () => {
                const db = await open(':memory:');
                expect(Database.open).toHaveBeenCalledWith(':memory:');
                expect(db).toBe(client);

                const db2 = await open(':memory:');
                expect(db2).toBe(db);
                expect(Database.open).toHaveBeenCalledTimes(1);

                expect(get()).toBe(db);
            });
        });
    });
});
