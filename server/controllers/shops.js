import { GeoPosition } from 'geo-position.ts';
import { SimpleOpeningHours } from 'simple-opening-hours';
import { InvalidParams } from '../middleware/errorHandler.js';
import { logStep } from '../middleware/logging.js';
import { SEARCH_RADIUS } from '../utils/constants.js';
import { getMasterDB } from '../utils/db.js';

export const validateCoordinates = async (req, _, next) => {
    logStep(req, 'controllers/shops::validateCoordinates');

    const { user_coordinates: coordinates } = req.query;
    const [userLatitude, userLongitude] = coordinates.split(',');
    const latitude = parseFloat(userLatitude);
    const longitude = parseFloat(userLongitude);

    if (!GeoPosition.IsValidGpsCoordinate(latitude, longitude)) {
        return next(InvalidParams('Geographical coordinates are not valid'));
    }

    req.userLocation = new GeoPosition(latitude, longitude);

    return next();
};

export const doList = async (req, res) => {
    logStep(req, 'controllers/shops::doList');
    const { search_term: searchTerm, category_id: categoryId } = req.query;

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

    const select = await getMasterDB().prepare(
        `SELECT s.id,b.id AS branchId,p.id AS productId,s.name AS shopName,s.schedule,latitude,longitude,b.name AS branchName,p.name AS productName FROM ${tables.join(
            ' ',
        )} WHERE ${filters.join(' AND ')}`,
    );

    select.bind(...values);
    const [resultSet] = await Promise.all([select.all(), select.finalize()]);

    const transformed = resultSet
        .filter((g) => new GeoPosition(g.latitude, g.longitude).Distance(req.userLocation).toFixed(0) <= SEARCH_RADIUS)
        .map(({ schedule, ...rest }) => ({ isOpen: new SimpleOpeningHours(schedule).isOpenOn(req.timestamp), ...rest }))
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
