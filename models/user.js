const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        hash: { type: String, required: true },
        email: { type: String, unique: true, required: true },
        roles: { type: [String], required: true },
        contactInfo: { type: [String], required: true }
    },
    { collection: 'ads' }
);


module.exports = mongoose.model('users', userSchema);