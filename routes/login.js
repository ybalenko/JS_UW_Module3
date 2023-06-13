const { Router } = require("express");
const router = Router();
const userDAO = require('../daos/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtBlacklist = require('jwt-blacklist'); // TODO
const TOKEN_SECRET = "secretkeyappearshere"; //TODO extract to a separate ENV file


async function passwordToHash(password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

function generateAccessToken(email, userId, roles) {
    let token = jwt.sign(
        { _id: userId, email: email, roles: roles },
        TOKEN_SECRET,
        { expiresIn: "1h" }
    );

    return token;
}


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }
    /* try {
        jwtBlacklist.verify(token);
    } catch (e) {
        console.log('Token is invalid', e)
        res.status(401).send(e.message);
    } */
    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
    });
}


router.post("/", async (req, res, next) => {
    const { email, password } = req.body;
    if (!password) {
        res.sendStatus(400);
    } else if (!password === '{}') {
        res.sendStatus(400);
    } else {
        const existingUser = await userDAO.getByEmail(email);
        if (existingUser) {
            const pwdMatch = await bcrypt.compare(password, existingUser.hash);
            if (pwdMatch) {
                let token = generateAccessToken(existingUser.email, existingUser._id, existingUser.roles);
                res.status(200).json({
                    token: token
                })
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    }
});


router.post("/signup", async (req, res, next) => {
    const user = req.body;
    const email = user.email;
    const pwd = user.password;

    if (!user) {
        res.sendStatus(401);
    } else if (!pwd) {
        res.sendStatus(400);
    } else if (!pwd === '{}') {
        res.sendStatus(400);
    } else {
        try {
            const existingUser = await userDAO.getByEmail(email);
            if (!existingUser) {
                const hash = await passwordToHash(pwd);
                const newUser = {
                    email: email,
                    hash: hash,
                    roles: ['user']
                };
                const user = await userDAO.create(newUser);
                res.status(200).json({
                    userId: user._id,
                    email: newUser.email,
                })
            } else {
                res.sendStatus(409);
            }
        } catch (e) {
            res.status(500).send(e.message);
        }
    }
});

router.post("/password", authenticateToken, async (req, res, next) => {
    const newPwd = req.body.password;
    if (!newPwd) {
        res.sendStatus(400);
    } else if (!newPwd === '{}') {
        res.sendStatus(400);
    } else {
        try {
            const updatedHash = await passwordToHash(newPwd);
            const user = await userDAO.getById(req.user._id);
            const newUser = {
                email: user.email,
                hash: updatedHash,
                roles: user.roles
            };
            await userDAO.updateUserPassword(req.user._id, newUser);
            res.sendStatus(200);
        } catch (e) {
            res.status(500).send(e.message);
        }
    }
});


// Work in progress
router.post("/logout", authenticateToken, async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    jwtBlacklist.blacklist(token);

});



module.exports = router;