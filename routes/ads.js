const { Router } = require("express");
const router = Router();
const adsDAO = require('../daos/ads');
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


router.get("/", async (req, res, next) => {
    try {
        const allAds = await adsDAO.getActiveAds();
        let result = [];
        for (let i in allAds) {
            let ads = allAds[i]
            const newAds = {
                expirationDate: ads.expirationDate.getFullYear() + "-" + (ads.expirationDate.getMonth() + 1).toString().padStart(2, '0') + "-" + (ads.expirationDate.getDate() + 1).toString().padStart(2, '0'),
                text: ads.text,
                details: ads.details
            }
            result.push(newAds)
        }
        return res.json(result);
    } catch (e) {
        console.log('Failed to get an item:', e)
        res.status(500).send(e.message);
    }
});


router.post("/", authenticateToken, async (req, res, next) => {
    try {
        const { expirationDate, text, details } = req.body;
        const newAds = {
            expirationDate: expirationDate,
            text: text,
            details: details,
            userId: req.user._id
        }
        const savedAds = await adsDAO.createAds(newAds);
        return res.json(savedAds);
    } catch (e) {
        console.log('Failed to create an item:', e)
        res.status(500).send(e.message);
    }
});

router.put("/:id", authenticateToken, async (req, res, next) => {
    try {
        const { expirationDate, text, details } = req.body;
        const adsId = req.params.id;
        const userId = req.user._id;
        const actualAds = await adsDAO.getById(adsId);
        if (!req.user.roles.includes('admin') && userId !== actualAds.userId) {
            return res.status(401).send("Unauthorized action");
        } else {
            const updatedAds = await adsDAO.updateById(adsId, { expirationDate, text, details });
            return res.json(updatedAds);
        }

    } catch (e) {
        console.log('Failed to update an item:', e)
        res.status(500).send(e.message);
    }
});


router.delete("/:id", authenticateToken, async (req, res, next) => {
    try {
        const adsId = req.params.id;
        const userId = req.user._id;
        const actualAds = await adsDAO.getById(adsId);
        if (!req.user.roles.includes('admin') && userId !== actualAds.userId) {
            return res.status(401).send("Unauthorized action");
        } else {
            await adsDAO.deleteById(adsId);
            return res.sendStatus(200);
        }

    } catch (e) {
        console.log('Failed to delete an item:', e)
        res.status(500).send(e.message);
    }
});

module.exports = router;