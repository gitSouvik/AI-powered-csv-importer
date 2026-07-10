const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { runImport } = require('../services/importPipeline');

const router = express.Router();

const SAMPLE_CSV = `created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,test@gmail.com,GOOD_LEAD_FOLLOW_UP,Client is asking to reschedule demo,,,
2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,test@gmail.com,DID_NOT_CONNECT,"Person was busy, will try again next week",,,
`;

router.get('/sample', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="groweasy-sample-leads.csv"'
  );
  res.send(SAMPLE_CSV);
});

/**
 * POST /api/csv/import
 * multipart/form-data, field name "file".
 *
 * Streams Server-Sent Events so the frontend can show live progress
 * as each mapping batch completes, then emits a final "done" event with
 * the full result payload (imported + skipped records, counts).
 */
router.post('/import', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file was uploaded (expected field "file")' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const csvText = req.file.buffer.toString('utf-8');
    const result = await runImport(csvText, (progress) => {
      send('progress', progress);
    });
    send('done', result);
    res.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
