const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');

const getProductPerformance = async (productIds) => {
    const db = await connectDB();
    const sales = db.collection('sales');
    const ratings = db.collection('ratings');

    console.log("Fetching performance data for productIds:", productIds);

    try {
        const salesDataPromises = productIds.map(id => {
            if (!ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId: ${id}`);
            }
            return sales.aggregate([
                { $match: { productId: new ObjectId(id) } },
                { $group: { _id: "$productId", totalSales: { $sum: "$amount" } } }
            ]).toArray();
        });

        const ratingsDataPromises = productIds.map(id => {
            if (!ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId: ${id}`);
            }
            return ratings.aggregate([
                { $match: { productId: new ObjectId(id) } },
                { $group: { _id: "$productId", averageRating: { $avg: "$rating" } } }
            ]).toArray();
        });

        const salesDataResults = await Promise.allSettled(salesDataPromises);
        const ratingsDataResults = await Promise.allSettled(ratingsDataPromises);

        const performanceData = productIds.map(id => {
            const salesData = salesDataResults.find(result => result.status === 'fulfilled' && result.value[0]?._id.toString() === id);
            const ratingsData = ratingsDataResults.find(result => result.status === 'fulfilled' && result.value[0]?._id.toString() === id);

            return {
                productId: id,
                totalSales: salesData?.value[0]?.totalSales || 0,
                averageRating: ratingsData?.value[0]?.averageRating || 0
            };
        });

        return performanceData;
    } catch (error) {
        console.error("An error occurred while fetching product performance data:", error);
        throw error;
    }
};

module.exports = { getProductPerformance };
