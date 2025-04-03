import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const app = express();
const upload = multer({ dest: 'public/' });

app.use(cors());
app.use(express.static('public'));

// ✅ Fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure 'public/' directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

app.post('/api/upload', upload.single('model'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileName = 'custom-chair.glb'; // Fixed filename
  const filePath = path.join(publicDir, fileName);

  // Rename uploaded file
  fs.renameSync(req.file.path, filePath);

  // Construct file URL
  const fileUrl = `${req.protocol}://${req.get('host')}/${fileName}`;
  res.json({ url: fileUrl });
});

app.listen(3000, () => console.log('Server running on port 3000'));
