/* eslint-disable no-unused-vars */
const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    // We were already streaming SSE progress events - close the
    // stream with an error event rather than trying to send headers.
    res.write(
      `event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`
    );
    return res.end();
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
