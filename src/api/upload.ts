import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse } from 'formidable'; // Use formidable to parse multipart/form-data

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse the incoming form-data
    const form = new Promise<{ fields: any; files: any }>((resolve, reject) => {
      const parser = new parse.Formidable();
      parser.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { files } = await form;
    const file = files.model?.[0]; // `model` is the field name from your FormData

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = file.originalFilename || `custom-chair-${Date.now()}.glb`;
    const fileBuffer = require('fs').readFileSync(file.filepath); // Read file from temp path

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable Vercel's default body parser for multipart/form-data
  },
};