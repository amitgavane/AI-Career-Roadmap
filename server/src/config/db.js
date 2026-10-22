import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-career-roadmap';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // On Node.js 18+ on Windows, 'localhost' resolves to IPv6 '::1'. If mongod only listens on IPv4, fallback to 127.0.0.1
    if (uri.includes('localhost')) {
      const fallbackUri = uri.replace('localhost', '127.0.0.1');
      try {
        console.warn(`[Database Notice] IPv6 connection failed (${error.message}). Retrying with IPv4: ${fallbackUri}`);
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] MongoDB Connected successfully via IPv4 fallback: ${fallbackConn.connection.host}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`[Database Error] Failed to connect to MongoDB: ${fallbackError.message}`);
        return null;
      }
    }

    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.warn('[Database Notice] Backend server is running. Ensure MongoDB service is started for database operations.');
    return null;
  }
};

export default connectDB;
