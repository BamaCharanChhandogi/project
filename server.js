// server.js
import express from 'express';
const app = express();
const port = 4000;
import concat from 'concat-stream'; // For concatenating streams
// In-memory storage for GLTF models
let models = {};

// Middleware to parse raw body for POST requests
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Endpoint to upload GLTF model
app.post('/upload', (req, res) => {
  const modelId = Date.now().toString(); // Unique ID based on timestamp
  req.pipe(concat((data) => {
    models[modelId] = data; // Store the GLTF data in memory
    const url = `http://192.168.1.100:${port}/model/${modelId}`;
    res.json({ url });
  }));
});

// Endpoint to serve GLTF model
app.get('/model/:id', (req, res) => {
  const modelId = req.params.id;
  const modelData = models[modelId];
  if (modelData) {
    res.set('Content-Type', 'application/octet-stream');
    res.send(modelData);
  } else {
    res.status(404).send('Model not found');
  }
});

// Start the server, binding to 0.0.0.0 to accept network connections
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.1.100:${port}`);
});