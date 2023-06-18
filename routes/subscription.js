const { Router } = require("express");
const router = Router();
const subscriptionDAO = require('../daos/subscription');
const jwt = require('jsonwebtoken');
const TOKEN_SECRET = "secretkeyappearshere"; //TODO extract to a separate ENV file


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
    });
}

router.get("/", authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const actualSubscription = await subscriptionDAO.getByUserId(userId);
        if (!req.user.roles.includes('admin') && userId !== actualSubscription.userId) {
            return res.status(401).send("Unauthorized action");
        } else {
            const allSubscriptions = await subscriptionDAO.getSubscriptions();
            let result = [];
            for (let i in allSubscriptions) {
                let subscription = allSubscriptions[i]
                const newSubscription = {
                    startDate: subscription.startDate.getFullYear() + "-" + (subscription.startDate.getMonth() + 1).toString().padStart(2, '0') + "-" + (subscription.startDate.getDate() + 1).toString().padStart(2, '0'),
                    name: subscription.name,
                    durationDays: subscription.durationDays
                }
                result.push(newSubscription);
            }
            return res.json(result);
        }
    } catch (e) {
        console.log('Failed to get an item:', e)
        res.status(500).send(e.message);
    }
});

router.post("/", authenticateToken, async (req, res, next) => {
    try {
        const { durationDays, name, startDate } = req.body;
        const newSubscription = {
            durationDays: durationDays,
            name: name,
            startDate: startDate,
            userId: req.user._id
        }
        const savedSubscription = await subscriptionDAO.createSubscription(newSubscription);
        return res.json(savedSubscription);
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message);
    }
});

router.put("/:id", authenticateToken, async (req, res, next) => {
    try {
        const { durationDays, name, startDate } = req.body;
        const userId = req.user._id;
        const subscriptionId = req.params.id;
        const actualSubscription = await subscriptionDAO.getById(subscriptionId);
        if (!req.user.roles.includes('admin') && userId !== actualSubscription.userId) {
            return res.status(401).send("Unauthorized action");
        } else {
            const updatedSubscription = await subscriptionDAO.updateById(req.params.id, { durationDays, name, startDate });
            return res.json(updatedSubscription);
        }

    } catch (e) {
        console.log(e)
        res.status(500).send(e.message);
    }
});


router.delete("/:id", authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const subscriptionId = req.params.id;
        const actualSubscription = await subscriptionDAO.getById(subscriptionId);
        if (!req.user.roles.includes('admin') && userId !== actualSubscription.userId) {
            return res.status(401).send("Unauthorized action");
        } else {
            await subscriptionDAO.deleteById(subscriptionId);
            return res.sendStatus(200);
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message);
    }
});

module.exports = router;