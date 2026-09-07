const router = require('express').Router();
const Controller = require('../controllers/permission.controller');
const { requirePermission } = require('../middleware/permission.middleware');

router.get('/effective', Controller.effective);
router.get('/', requirePermission('PERMISSION_MANAGE'), Controller.listPermissions);
router.get('/assignments', requirePermission('PERMISSION_MANAGE'), Controller.listAssignments);
router.post('/assignments', requirePermission('PERMISSION_MANAGE'), Controller.grant);
router.delete('/assignments/:id', requirePermission('PERMISSION_MANAGE'), Controller.revoke);

module.exports = router;
