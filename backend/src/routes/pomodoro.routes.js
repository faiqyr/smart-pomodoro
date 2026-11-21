const router = require('express').Router();
const { startSession, pauseSession, resumeSession, stopSession, getHistory, getActiveSession } = require('../controllers/pomodoro.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.post('/start', startSession);
router.post('/pause', pauseSession);
router.post('/resume', resumeSession);
router.post('/stop', stopSession);
router.get('/history', getHistory);
router.get('/active', getActiveSession);

module.exports = router;
