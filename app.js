const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { doubleCsrf } = require('csrf-csrf');
require('dotenv').config();

const connectToDb = require('./config/db');
const indexRoutes = require('./routes/index.routes');
const userRoutes = require('./routes/user.routes');
const fileRoutes = require('./routes/file.routes');

const app = express();

connectToDb();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-csrf-secret', // Use env variable or fallback
  cookieName: '_csrf',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
  getTokenFromRequest: (req) => req.body._csrf || req.headers['csrf-token'],
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.csrfToken = generateCsrfToken(req); // Generate token for views
  next();
});

app.use(doubleCsrfProtection); // Apply CSRF protection

app.use('/', indexRoutes);
app.use('/user', userRoutes);
app.use('/', fileRoutes);

app.use((err, req, res, next) => {
  if (err.code === 'INVALID_CSRF_TOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;