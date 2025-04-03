import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const app = express();
const upload = multer({ dest: 'public/models/' });

app.use(cors());
app.use(express.static('public'));

// ✅ Fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post('/api/upload', upload.single('model'), (req, res) => {
  const fileName = 'custom-chair.glb';
  const filePath = path.join(__dirname, 'public/models', fileName);
  
  // Rename uploaded file
  fs.renameSync(req.file.path, filePath);

  const fileUrl = `${req.protocol}://${req.get('host')}/models/${fileName}`;
  res.json({ url: fileUrl });
});

app.listen(3000, () => console.log('Server running on port 3000'));
