const mongoose = require('mongoose');

const adsSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
        userId: { type: String, required: true, index: true }
    },
    { collection: 'ads' }
);


module.exports = mongoose.model('ads', adsSchema);