import { GeoPosition } from 'geo-position.ts';
import { SimpleOpeningHours } from 'simple-opening-hours';
import { getClient } from '../utils/db.js';

export const doList = async (req, res) => {
    const { search_term: searchTerm, user_coordinates: coordinates, category_id: categoryId } = req.query;

    const [userLatitude, userLongitude] = coordinates.split(',');
    const userLocation = new GeoPosition(parseFloat(userLatitude), parseFloat(userLongitude));

    const tables = ['shops s INNER JOIN products p ON p.shop=s.id INNER JOIN branches b ON b.shop=s.id'];
    const filters = ['(p.name LIKE ? OR s.name LIKE ?)'];
    const values = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (categoryId) {
        tables.push(
            'INNER JOIN shop_categories sc ON sc.shop=s.id INNER JOIN product_categories pc ON pc.product=p.id',
        );
        filters.push('(pc.category=? OR sc.category=?)');
        values.push(categoryId, categoryId);
    }

    const select = await getClient().prepare(
        `SELECT s.id,b.id AS branchId,p.id AS productId,s.name AS shopName,s.schedule,latitude,longitude,b.name AS branchName,p.name AS productName FROM ${tables.join(
            ' ',
        )} WHERE ${filters.join(' AND ')}`,
    );

    select.bind(...values);
    const [resultSet] = await Promise.all([select.all(), select.finalize()]);

    const transformed = resultSet
        .filter((g) => new GeoPosition(g.latitude, g.longitude).Distance(userLocation).toFixed(0) <= 5000)
        .map(({ schedule, ...rest }) => ({ isOpen: new SimpleOpeningHours(schedule).isOpenNow(), ...rest }))
        .reduce(
            (shops, { isOpen, id, branchId, latitude, longitude, shopName, branchName, productId, productName }) => {
                const shop = shops[id] || { id: id.toString(), name: shopName, branches: {}, products: [] };
                shop.branches = {
                    ...shop.branches,
                    [branchId]: { id: branchId.toString(), name: branchName, isOpen, latitude, longitude },
                };
                shop.products = [...shop.products, { id: productId.toString(), name: productName }];
                return { ...shops, [id]: shop };
            },
            {},
        );

    const shops = Object.values(transformed).map(({ branches, ...shop }) => ({
        ...shop,
        branches: Object.values(branches),
    }));

    res.json({ data: { shops } });
};

export default doList;
