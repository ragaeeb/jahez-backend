import Database from 'sqlite-async';

let masterClient = null;
let auditClient = null;

export const openMasterDB = async (path) => {
    if (masterClient) {
        return masterClient;
    }

    masterClient = await Database.open(path);
    return masterClient;
};

export const openAuditDB = async (path) => {
    if (auditClient) {
        return auditClient;
    }

    auditClient = await Database.open(path);
    return auditClient;
};

export const getMasterDB = () => masterClient;
export const getAuditDB = () => auditClient;

export const close = async () => {
    if (masterClient) {
        await masterClient.close();
    }

    if (auditClient) {
        await auditClient.close();
    }
};
