/* eslint-disable no-await-in-loop */
import Database from 'sqlite-async';
import fs from 'fs';
import dotenv from 'dotenv';

const init = async () => {
    dotenv.config();

    const { DB_PATH } = process.env;

    fs.unlinkSync(DB_PATH);
    const client = await Database.open(DB_PATH);

    await Promise.all(
        [
            `CREATE TABLE shops (id INTEGER PRIMARY KEY, name TEXT NOT NULL, schedule TEXT NOT NULL, CHECK(name <> '' AND schedule <> ''))`,
            `CREATE TABLE branches (id INTEGER PRIMARY KEY, shop INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE ON UPDATE CASCADE, name TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, CHECK(name <> ''))`,
            `CREATE TABLE products (id INTEGER PRIMARY KEY, shop INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE ON UPDATE CASCADE, name TEXT NOT NULL, CHECK(name <> ''))`,
            `CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, CHECK(name <> ''))`,
            `CREATE TABLE shop_categories (id INTEGER PRIMARY KEY, shop INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE ON UPDATE CASCADE, category INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE, UNIQUE(shop,category) ON CONFLICT IGNORE)`,
            `CREATE TABLE product_categories (id INTEGER PRIMARY KEY, product INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE, category INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE, UNIQUE(product,category) ON CONFLICT IGNORE)`,
        ].map((s) => client.exec(s)),
    );

    const [insertShop, insertBranch, insertCategory, insertShopCategory, insertProduct, insertProductCategory] =
        await Promise.all(
            [
                `INSERT INTO shops (name,schedule) VALUES (?,?)`,
                `INSERT INTO branches (shop,name,latitude,longitude) VALUES (?,?,?,?)`,
                `INSERT INTO categories (name) VALUES (?)`,
                `INSERT INTO shop_categories (shop,category) VALUES (?,?)`,
                `INSERT INTO products (shop,name) VALUES (?,?)`,
                `INSERT INTO product_categories (product,category) VALUES (?,?)`,
            ].map((s) => client.prepare(s)),
        );

    const result = await client.transaction(async (db) => {
        const shops = JSON.parse(fs.readFileSync('data/shops.json'));
        const inserts = [];
        const categoryToId = {};

        const populateCategories = async (id, categories, insertItemCategory) => {
            const newInserts = [];

            for (let l = 0; l < categories.length; l += 1) {
                const category = categories[l];

                if (!categoryToId[category]) {
                    insertCategory.bind(category);
                    const { lastID: categoryId } = await insertCategory.run();
                    categoryToId[category] = categoryId;
                }

                const categoryId = categoryToId[category];
                insertItemCategory.bind(id, categoryId);
                newInserts.push(insertItemCategory.run());
            }

            return newInserts;
        };

        for (let i = 0; i < shops.length; i += 1) {
            const shop = shops[i];
            insertShop.bind(shop.name, shop.schedule);
            // eslint-disable-next-line no-await-in-loop
            const { lastID: shopId } = await insertShop.run();

            inserts.push(
                ...shop.branches.map(({ name, latitude, longitude }) => {
                    insertBranch.bind(shopId, name, latitude, longitude);
                    return insertBranch.run();
                }),
            );

            inserts.push(...(await populateCategories(shopId, shop.categories, insertShopCategory)));

            for (let k = 0; k < shop.products.length; k += 1) {
                const { name, categories } = shop.products[k];

                insertProduct.bind(shopId, name);

                const { lastID: productId } = await insertProduct.run();
                inserts.push(...(await populateCategories(productId, categories, insertProductCategory)));
            }
        }

        return Promise.all(inserts);
    });

    await Promise.all(
        [
            `CREATE INDEX IF NOT EXISTS branches_idx ON branches(shop)`,
            `CREATE INDEX IF NOT EXISTS products_idx ON products(shop)`,
            `CREATE INDEX IF NOT EXISTS shop_categories_idx ON shop_categories(shop, category)`,
            `CREATE INDEX IF NOT EXISTS product_categories_idx ON product_categories(product, category)`,
        ].map((s) => client.exec(s)),
    );

    console.log('Database created:', DB_PATH);
};

init();
