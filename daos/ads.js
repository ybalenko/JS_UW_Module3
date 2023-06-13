const Ads = require('../models/ads');
const mongoose = require('mongoose');
module.exports = {};


/* module.exports.getAds = () => {
    try {
        return Ads.find().lean();
    } catch (e) {
        return null;
    }
}
 */
module.exports.getActiveAds = () => {
    try {
        return Ads.find({ expirationDate: { $gt: new Date('2024-01-01') } }).lean();
    } catch (e) {
        return null;
    }
}

module.exports.getById = (adsId) => {
    if (!mongoose.Types.ObjectId.isValid(adsId)) {
        return false;
    }
    return Ads.findOne({ _id: adsId }).lean();
}


module.exports.getByText = (text) => {
    return Ads.findOne({ text: text }).lean();
}



module.exports.createAds = async (adsData) => {
    return await Ads.create(adsData);
}


module.exports.updateById = async (adsId, newObj) => {
    if (!mongoose.Types.ObjectId.isValid(adsId)) {
        return false;
    }
    await Ads.findOneAndUpdate({ _id: adsId }, newObj);
    return true;
}

module.exports.deleteById = async (adsId) => {
    if (!mongoose.Types.ObjectId.isValid(adsId)) {
        return false;
    }
    await Ads.deleteOne({ _id: adsId });
    return true;
}