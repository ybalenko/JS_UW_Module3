const { Router } = require("express");
const router = Router();

router.use("/login", require('./login'));
router.use("/ads", require('./ads'));
router.use("/subscription", require('./subscription'));

module.exports = router;