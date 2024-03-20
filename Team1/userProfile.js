const { connectDB } = require('../dbConfig');

async function updateUserEmail(userId, newEmail) {
    const db = await connectDB();
    const result = await db.collection('users').updateOne({ _id: userId }, { $set: { email: newEmail } });
    console.log(result);
    return result;
}

// Add similar functions for updating other profile details here

module.exports = { updateUserEmail };