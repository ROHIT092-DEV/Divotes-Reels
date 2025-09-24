import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI as string | undefined;

if (!MONGO_URI) {
  throw new Error('Please add MONGO_URI in .env.local');
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      mongoose?: MongooseCache;
    }
  }
}

const cached: MongooseCache = (global as unknown as NodeJS.Global).mongoose || {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI as string).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
