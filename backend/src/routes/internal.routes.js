const router = require('express').Router();
const { requireInternalApi } = require('../middleware/internal-api.middleware');
const Controller = require('../controllers/internal-asset.controller');

router.use(requireInternalApi);
router.get('/assets/assigned', Controller.assignedToUser);
router.get('/assets/:assetId/external-references', Controller.listExternalReferences);
router.post('/assets/:assetId/external-references', Controller.linkExternalReference);

module.exports = router;
