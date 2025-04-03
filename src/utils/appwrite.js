// utils/appwrite.js
import { Client, Storage, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // e.g., 'https://cloud.appwrite.io/v1'
  .setProject('67e54122002b48ebf3d1');

const storage = new Storage(client);
const databases = new Databases(client);

export { client, storage, databases };