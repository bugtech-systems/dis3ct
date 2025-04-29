// lib/dbConnect.ts
import mongoose from 'mongoose';


// const MONGODB_URI = 'mongodb+srv://user:user@powertools-001.2mrrjyp.mongodb.net/alayon-db';
const MONGODB_URI = 'mongodb://localhost:27017/sanisidro-db';
// const MONGODB_URI = 'mongodb://localhost:27017/fingerprintDB';


console.log(MONGODB_URI, "MONGOD")
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose: MongooseCache;
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 120000, // Wait 30s before giving up on server selection
      socketTimeoutMS: 120000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 120000, // Timeout after 30s if unable to connect
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  console.log(process.env.MONGODB_URI, `Connected: ${MONGODB_URI}`)
  return cached.conn;
}

export default connectToDatabase;
