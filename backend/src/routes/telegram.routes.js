const router = require('express').Router();
const { getSettings, updateSettings, testNotification } = require('../controllers/telegram.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/test', testNotification);

module.exports = router;
