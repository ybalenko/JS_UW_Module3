const Ads = require('../models/ads');

module.exports = {};


module.exports.getUserAds = async (userId) => {
    try {
        return await Ads.find({ userId: userId }).lean();
    } catch (e) {
        return null;
    }
}

module.exports.getAds = async (adsId) => {
    try {
        return await Ads.findOne({ _id: adsId }).lean();
    } catch (e) {
        return null;
    }
}

module.exports.createAds = async (adsData) => {
    return await Ads.create(adsData);
}