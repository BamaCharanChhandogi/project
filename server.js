// server.js
import express from 'express';
import multer from 'multer';
import path from 'path';
const app = express();
import cors from 'cors';

const upload = multer({ dest: 'public/models/' });

app.use(express.static('public'));

app.post('/api/upload', upload.single('model'), (req, res) => {
  const fileName = 'custom-chair.glb';
  const filePath = path.join(__dirname, 'public/models', fileName);
  require('fs').renameSync(req.file.path, filePath); // Rename to custom-chair.glb
  const fileUrl = `${req.protocol}://${req.get('host')}/models/${fileName}`;
  res.json({ url: fileUrl });
});

app.listen(3000, () => console.log('Server running on port 3000'));