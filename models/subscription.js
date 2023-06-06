const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        durationDays: { type: Number },
        startDate: { type: Date, required: true },
        userId: { type: String, required: true, index: true }
    },
    { collection: 'ads' }
);


module.exports = mongoose.model('subscriptions', subscriptionSchema);