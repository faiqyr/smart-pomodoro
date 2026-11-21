const router = require('express').Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
