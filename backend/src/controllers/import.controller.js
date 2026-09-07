const R = require('../utils/response.util');
const ImportService = require('../services/import.service');

function xlsxHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
}

async function preview(req, res, next) { try { return R.created(res, await ImportService.preview(req), 'Import preview generated'); } catch (err) { return next(err); } }
async function getPreview(req, res, next) { try { return R.ok(res, await ImportService.getPreview(req), 'Import preview loaded'); } catch (err) { return next(err); } }
async function commit(req, res, next) { try { return R.ok(res, await ImportService.commit(req), 'Import committed'); } catch (err) { return next(err); } }
async function cancel(req, res, next) { try { return R.ok(res, await ImportService.cancel(req), 'Import preview canceled'); } catch (err) { return next(err); } }
async function template(req, res, next) { try { const result = await ImportService.template(req); xlsxHeaders(res, result.filename); return res.send(result.buffer); } catch (err) { return next(err); } }
async function downloadErrors(req, res, next) { try { const result = await ImportService.downloadErrors(req); xlsxHeaders(res, result.filename); return res.send(result.buffer); } catch (err) { return next(err); } }

module.exports = { preview, getPreview, commit, cancel, template, downloadErrors };
