const express = require('express');
const path = require('path');
const apiRouter = require('./api');
const router = express.Router();
router.use('/api', apiRouter);
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../../frontend/dist');
  router.use(express.static(dist));
  router.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
module.exports = router;
