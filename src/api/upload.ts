import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse } from 'formidable';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const form = new Promise<{ fields: any; files: any }>((resolve, reject) => {
      const parser = new parse.Formidable();
      parser.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { files } = await form;
    const file = files.model?.[0]; // 'model' matches the FormData key in frontend

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = file.originalFilename || `custom-chair-${Date.now()}.glb`;
    const fileBuffer = require('fs').readFileSync(file.filepath);

    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      token: 'vercel_blob_rw_znGik1I1ZsRdMjlT_vSU6Osm95Y8IIuechf9VENWnoofTBf',
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for multipart/form-data
  },
};