const express = require('express');
const router = express.Router();
const loansController = require('../controllers/loansController');

router.get('/opportunities', loansController.getOpportunities);

module.exports = router;
