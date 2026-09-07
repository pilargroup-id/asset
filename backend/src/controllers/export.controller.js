const ExportService = require('../services/export.service');

async function generate(req, res, next) {
  try {
    const result = await ExportService.generate(req);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Export-Row-Count', String(result.row_count));
    return res.send(result.buffer);
  } catch (err) {
    return next(err);
  }
}

module.exports = { generate };
