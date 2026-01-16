const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Import your Express app
const app = require('./server');

// Cache database connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return;
  }
  
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    // Configure for Lambda
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log('✅ MongoDB connected in Lambda');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// Export Lambda handler
module.exports.handler = async (event, context) => {
  // Prevent Lambda from waiting for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Ensure database connection
  await connectDB();
  
  // Create serverless handler from Express app
  const handler = serverless(app);
  return handler(event, context);
};

// For local development
if (process.env.IS_OFFLINE || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
}
