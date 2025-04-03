import express from 'express';
import concat from 'concat-stream';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;
let models = {};

app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(cors({ origin: '*' }));

app.post('/upload', (req, res) => {
  const modelId = Date.now().toString();
  req.pipe(concat((data) => {
    models[modelId] = data;
    const url = `${req.protocol}://${req.get('host')}/model/${modelId}`;
    console.log('Generated URL:', url);
    res.json({ url });
  }));
});

app.get('/model/:id', (req, res) => {
  const modelId = req.params.id;
  const modelData = models[modelId];
  if (modelData) {
    res.set('Content-Type', 'model/gltf-binary'); // Correct MIME type for .glb
    res.set('Content-Disposition', 'inline; filename="model.glb"'); // Optional: suggest filename
    res.send(modelData);
  } else {
    res.status(404).send('Model not found');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});