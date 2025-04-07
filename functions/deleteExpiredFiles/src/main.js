import { Client, Databases, Storage, Query } from 'node-appwrite';
export default async function handler({ req, res }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67e54122002b48ebf3d1')
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { documents } = await databases.listDocuments(
      '67ee315b00173845a432',
      'fileMetadata',
      [Query.lessThan('createdAt', twentyFourHoursAgo)]
    );

    let deletedCount = 0;
    for (const doc of documents) {
      const { glbFileId, usdzFileId } = doc;
      try {
        await storage.deleteFile('67e541df000fda7737de', glbFileId);
        await storage.deleteFile('67e541df000fda7737de', usdzFileId);
        await databases.deleteDocument('67ee315b00173845a432', 'fileMetadata', doc.$id);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete files for doc ${doc.$id}:`, err.message);
      }
    }

    res.json({ deleted: deletedCount });
  } catch (error) {
    console.error('Deletion error:', error);
    res.json({ error: error.message }, 500);
  }
}
