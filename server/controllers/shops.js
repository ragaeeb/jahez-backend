export const doList = async (req, res) => {
    const {
        search_term: searchTerm,
        user_coordinates: { latitude, longitude },
        category_id: categoryId,
    } = req.query;
};

export default doList;
