const router = require('express').Router();
const { reportDrowsiness, reportFocus, getDrowsinessEvents, getFocusEvents } = require('../controllers/vision.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.post('/drowsiness', reportDrowsiness);
router.post('/focus', reportFocus);
router.get('/drowsiness', getDrowsinessEvents);
router.get('/focus', getFocusEvents);

module.exports = router;
