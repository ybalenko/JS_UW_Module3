const Subscription = require('../models/subscription');
const mongoose = require('mongoose');
module.exports = {};

module.exports.getSubscriptions = async () => {
    try {
        const subscriptions = await Subscription.find().lean();
        return subscriptions
    } catch (e) {
        return null;
    }
}

module.exports.getByName = (name) => {
    return Subscription.findOne({ name: name }).lean();
};

module.exports.getById = (subscriptionId) => {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return false;
    }
    return Subscription.findOne({ _id: subscriptionId }).lean();
};


module.exports.updateById = async (subscriptionId, newObj) => {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return false;
    }
    return await Subscription.findOneAndUpdate({ _id: subscriptionId }, newObj);
};


module.exports.deleteById = async (subscriptionId) => {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return false;
    }
    return await Subscription.deleteOne({ _id: subscriptionId });
};


module.exports.createSubscription = async (subscriptionData) => {
    return await Subscription.create(subscriptionData);
};