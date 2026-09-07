const router = require('express').Router();
const Controller = require('../controllers/import.controller');
const { requirePermission } = require('../middleware/permission.middleware');
const { uploadImport } = require('../middleware/upload.middleware');

router.get('/templates/:type', requirePermission('IMPORT_DATA'), Controller.template);
router.get('/preview/:previewToken', requirePermission('IMPORT_DATA'), Controller.getPreview);
router.post('/:type/preview', requirePermission('IMPORT_DATA'), uploadImport, Controller.preview);
router.post('/commit', requirePermission('IMPORT_DATA'), Controller.commit);
router.delete('/preview/:previewToken', requirePermission('IMPORT_DATA'), Controller.cancel);
router.get('/errors/:errorFileToken', requirePermission('IMPORT_DATA'), Controller.downloadErrors);

module.exports = router;
