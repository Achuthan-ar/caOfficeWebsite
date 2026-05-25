import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import careersRoutes from './routes/careersRoutes.js';
import internshipRoutes from './routes/internshipRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import path from 'path';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Set security headers
app.use(helmet());

// Prevent MongoDB NoSQL Injection Attacks
app.use(mongoSanitize());

// Cookie parser for reading secure HTTP-only cookies
app.use(cookieParser());

// Rate limiter for security (brute-force protection on Auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter for overall system protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Limit each IP to 500 requests per 15 mins
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom recursive Input Sanitizer to prevent Cross-Site Scripting (XSS)
const sanitizeInput = (val, key = null) => {
  if (key === 'content') return val; // preserve rich-text HTML for blogs
  if (typeof val === 'string') {
    return val
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (typeof val === 'object' && val !== null) {
    for (const k in val) {
      val[k] = sanitizeInput(val[k], k);
    }
  }
  return val;
};

const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

app.use(xssSanitizer);

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Main status route
app.get('/', (req, res) => {
  res.json({
    message: 'MERN Stack Role-Based Access Control API is running',
    status: 'online',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', generalLimiter); // Apply general rate limit to all other api endpoints
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploads directory as a static folder for local storage uploads fallback
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/', sitemapRoutes); // Expose sitemap.xml at root level

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack || err.message || err);

  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid id format: ${err.value}`;
  }

  // 2. Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const key = Object.keys(err.keyValue)[0];
    message = `${key.charAt(0).toUpperCase() + key.slice(1)} already exists.`;
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = {};
    Object.values(err.errors).forEach((val) => {
      errors[val.path] = val.message;
    });
    message = 'Validation failed.';
  }

  // 4. JWT Expiration/Invalid Errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please login again.';
  }
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid secure credentials. Please login again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
