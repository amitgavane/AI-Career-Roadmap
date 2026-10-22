import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Initialize Database Connection and start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`-----------------------------------------------------`);
    console.log(`[Server] AI Career Roadmap Server running on Port ${PORT}`);
    console.log(`[Health] http://localhost:${PORT}/api/health`);
    console.log(`-----------------------------------------------------`);
  });

  return server;
};

startServer();

export default app;
