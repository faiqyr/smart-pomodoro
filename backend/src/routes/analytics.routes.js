const router = require('express').Router();
const { getDailyAnalytics, getWeeklyAnalytics, getMonthlyAnalytics, getProductivityInsights } = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/daily', getDailyAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/insights', getProductivityInsights);

module.exports = router;
