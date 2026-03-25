// MongoDB Connection Link for Swiftie Web
// Vercel Serverless Function Template for future backend connection
export const MONGODB_URI = import.meta.env.MONGODB_URI || "mongodb+srv://kalnipun442_db_user:g5BwizwlLrDosiXp@futurekal442.jzzysqj.mongodb.net/?appName=futurekal442";

// When deploying to Vercel, serverless functions can use this URI to connect to MongoDB Atlas directly:
/** Example usage in an API route (e.g. /api/users.js):
 * 
 * import { MongoClient } from 'mongodb';
 * 
 * const uri = process.env.MONGODB_URI;
 * const client = new MongoClient(uri);
 * 
 * export default async function handler(request, response) {
 *   await client.connect();
 *   const database = client.db('swiftie_social');
 *   const users = database.collection('users');
 *   const allUsers = await users.find({}).toArray();
 *   response.status(200).json(allUsers);
 * }
 */
