const { Client, Storage } = require('appwrite');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { gltfToUsdz } = require('@gltf-transform/cli');

module.exports = async (req, res) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67e54122002b48ebf3d1')
    .setKey(req.variables['67ef997f002931317a12']); // Secure API key from environment

  const storage = new Storage(client);

  // Get GLB file ID from request payload
  const payload = JSON.parse(req.payload || '{}');
  const glbFileId = payload.glbFileId;

  if (!glbFileId) {
    return res.json({ error: 'Missing glbFileId in payload' }, 400);
  }

  try {
    // Download GLB file from Appwrite
    const glbUrl = `${client.config.endpoint}/storage/buckets/67e541df000fda7737de/files/${glbFileId}/view?project=67e54122002b48ebf3d1}`;
    const glbResponse = await fetch(glbUrl);
    const glbBuffer = await glbResponse.buffer();
    const glbPath = path.join('/tmp', `${glbFileId}.glb`);
    await fs.writeFile(glbPath, glbBuffer);

    // Convert GLB to USDZ
    const usdzPath = path.join('/tmp', `${glbFileId}.usdz`);
    await gltfToUsdz(glbPath, usdzPath);

    // Upload USDZ to Appwrite
    const usdzBuffer = await fs.readFile(usdzPath);
    const usdzFile = new File([usdzBuffer], 'custom-chair.usdz', { type: 'model/vnd.usdz+zip' });
    const usdzResponse = await storage.createFile(
      '67e541df000fda7737de',
      'unique()',
      usdzFile
    );

    // Clean up temporary files
    await fs.unlink(glbPath);
    await fs.unlink(usdzPath);

    // Return the USDZ file ID
    res.json({ usdzFileId: usdzResponse.$id });
  } catch (error) {
    console.error('Error:', error);
    res.json({ error: 'Failed to convert GLB to USDZ', details: error.message }, 500);
  }
};