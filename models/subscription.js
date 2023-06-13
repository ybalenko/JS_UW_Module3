const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        durationDays: { type: Number, required: true },
        startDate: { type: Date, required: true },
        userId: { type: String, required: true, index: true }
    },
    { collection: 'subscriptions' }
);


module.exports = mongoose.model('subscriptions', subscriptionSchema);