const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.get('/home', authMiddleware, (req, res) => {
  res.render('home', { csrfToken: res.locals.csrfToken });
});

module.exports = router;