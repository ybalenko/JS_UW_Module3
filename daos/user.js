const User = require('../models/user');

module.exports = {};

module.exports.getByEmail = (email) => {
    return User.findOne({ email: email }).lean();
}

module.exports.getById = (userId) => {
    return User.findOne({ _id: userId }).lean();
}

module.exports.updateUserPassword = (userId, userData) => {
    return User.updateOne({ _id: userId }, userData);
}

module.exports.create = (userData) => {
    return User.create(userData);
}