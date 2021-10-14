import Database from 'sqlite-async';

let client = null;

export const openDB = async (path) => {
    if (client) {
        await client.close();
    }

    client = await Database.open(path);
    return client;
};

export const getClient = () => client;

export const close = async () => {
    if (client) {
        return client.close();
    }

    return null;
};
