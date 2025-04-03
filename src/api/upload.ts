import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('model') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const fileName = file.name; // Use the unique filename from the client
  const blob = await put(fileName, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN, // Set this in your Vercel env vars
  });

  return NextResponse.json({ url: blob.url });
}

export const config = {
  api: {
    bodyParser: false, // Required for multipart/form-data
  },
};