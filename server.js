require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
  const authRoutes        = require('./src/routes/auth.routes');
  const problemsRoutes    = require('./src/routes/problems.routes');
  const userRoutes        = require('./src/routes/user.routes');
  const executionRoutes   = require('./src/routes/execution.routes');
  const scraperRoutes     = require('./src/routes/scraper.routes');   // <-- THÊM
  const discussionRoutes  = require('./src/routes/discussion.routes');
  const announcementRoutes = require('./src/routes/announcement.routes');
  const app = express();
 
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
 
  app.use('/api/execute', executionRoutes);
  app.use('/api/admin/scraper', scraperRoutes);                       // <-- THÊM

  // Serve uploaded files
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  app.get('/health', (req, res) => res.json({ status: 'OK' }));
  
  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api/problems', problemsRoutes);
  app.use('/api/discussions', discussionRoutes);
  app.use('/api/announcements', announcementRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

module.exports = app;
