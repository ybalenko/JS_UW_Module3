const mongoose = require('mongoose');

const adsSchema = new mongoose.Schema(
    {
        expirationDate: { type: Date, required: true },
        text: { type: String, required: true },
        details: { type: String, required: true },
        userId: { type: String, required: true, index: true }
    },
    { collection: 'ads' }
);


module.exports = mongoose.model('ads', adsSchema);