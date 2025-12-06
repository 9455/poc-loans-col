const express = require('express');
const router = express.Router();
const loansController = require('../controllers/loansController');

router.get('/opportunities', loansController.getOpportunities);
router.post('/positions', loansController.createPosition);
router.get('/positions/:address', loansController.getUserPositions);
// Actions
router.get('/position/:id', loansController.getPositionById);
router.get('/stats', loansController.getPlatformStats);
router.post('/create', loansController.createPosition);
router.post('/repay/:id', loansController.repayPosition);
router.get('/config/fees', loansController.getFeesConfig);

module.exports = router;
