import { MongoClient } from 'mongodb';

// MongoDB is optional during migration to PostgreSQL
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placeholder';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Only initialize MongoDB client if URI is actually configured
if (process.env.MONGODB_URI) {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // Provide a dummy promise that will fail if actually used
  clientPromise = Promise.reject(new Error('MongoDB URI not configured. Please use PostgreSQL instead.'));
}

export default clientPromise;
