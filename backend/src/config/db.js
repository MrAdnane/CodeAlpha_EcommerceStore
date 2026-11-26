const mongoose = require('mongoose');

// Connect to MongoDB.
// Production: MONGO_URI from .env (Atlas).
// Local testing: USE_MEMORY_DB=true starts an in-memory MongoDB
// (mongodb-memory-server, a dev dependency) and ignores MONGO_URI.
async function connectDB() {
  let uri = process.env.MONGO_URI;
  if (process.env.USE_MEMORY_DB === 'true') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    global.__mongod = mongod; // kept so tests can stop it
    console.log('Using in-memory MongoDB for local testing');
  }
  if (!uri) throw new Error('MONGO_URI is not set. Copy .env.example to .env');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = connectDB;
