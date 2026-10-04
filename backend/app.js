const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { restoreUser } = require('./utils/auth');
const stripeRouter = require('./routes/api/stripe');
const routes = require('./routes');
const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (process.env.NODE_ENV !== 'production') app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Stripe webhook must receive the unparsed request body.
app.use('/api/stripe', stripeRouter);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(restoreUser);
app.use(routes);
app.use((req, _res, next) => { const err = new Error(`Route not found: ${req.method} ${req.path}`); err.status = 404; next(err); });
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error', stack: process.env.NODE_ENV === 'production' ? null : err.stack });
});
module.exports = app;
