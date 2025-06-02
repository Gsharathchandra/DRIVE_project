const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');

  router.get('/', (req, res) => {
    res.redirect('/user/login');
  });

  router.get('/home', authMiddleware, (req, res) => {
    res.render('home', { error: req.query.error });
  });

  module.exports = router;