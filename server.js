// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 4000; // Use environment port for deployment
const concat = require('concat-stream');

let models = {};

app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

app.post('/upload', (req, res) => {
  const modelId = Date.now().toString();
  req.pipe(concat((data) => {
    models[modelId] = data;
    const url = `${req.protocol}://${req.get('host')}/model/${modelId}`; // Dynamic URL
    res.json({ url });
  }));
});

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

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});