// functions/convertToUsdz/src/main.js
const { Client, Storage } = require('node-appwrite');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async function main({ req, res, log, error }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67e54122002b48ebf3d1')
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const storage = new Storage(client);
  
  // Debug all request properties
  log('Raw body received: ' + req.bodyJson);
  log('Content-Type: ' + req.headers['content-type']);
  log('Content-Length: ' + req.headers['content-length']);
  log('Request method: ' + req.method);
  
  let payload;
  try {
    // Try multiple approaches to get the payload
    if (req.body && typeof req.body === 'string' && req.body.trim() !== '') {
      payload = JSON.parse(req.body);
    } else if (req.rawBody) {
      // Some environments use rawBody
      payload = JSON.parse(req.rawBody);
    } else {
      // Fallback to empty object
      payload = {};
    }
    
    log('Parsed payload: ' + JSON.stringify(payload));
  } catch (e) {
    error('Failed to parse payload: ' + e.message);
    return res.json({ error: 'Invalid payload format' }, 400);
  }

  const { glbFileId } = payload;
  if (!glbFileId) {
    error('Missing glbFileId in payload after parsing');
    return res.json({ error: 'Missing glbFileId' }, 400);
  }

  // Rest of your function...

  log('Processing GLB file ID: ' + glbFileId);

  try {
    const tmpDir = os.tmpdir();
    const glbPath = path.join(tmpDir, `${glbFileId}.glb`);
    const usdzPath = path.join(tmpDir, `${glbFileId}.usdz`);

    // Download GLB
    const glbFile = await storage.getFileDownload('67e541df000fda7737de', glbFileId);
    fs.writeFileSync(glbPath, Buffer.from(glbFile));
    log('GLB downloaded to: ' + glbPath);

    // Convert to USDZ
    try {
      execSync(`usd_from_gltf ${glbPath} ${usdzPath}`, { stdio: 'inherit' });
      log('Converted GLB to USDZ at: ' + usdzPath);
    } catch (conversionError) {
      error('Conversion failed: ' + conversionError.message);
      throw conversionError;
    }

    // Upload USDZ
    const usdzFileBuffer = fs.readFileSync(usdzPath);
    const usdzResponse = await storage.createFile(
      '67e541df000fda7737de',
      'unique()',
      new File([usdzFileBuffer], 'custom-chair.usdz', { type: 'model/vnd.usdz+zip' })
    );
    log('USDZ uploaded with ID: ' + usdzResponse.$id);

    // Cleanup
    fs.unlinkSync(glbPath);
    fs.unlinkSync(usdzPath);

    return res.json({ usdzFileId: usdzResponse.$id }, 200);
  } catch (err) {
    error('Processing error: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
};