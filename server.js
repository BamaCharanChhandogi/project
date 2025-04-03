// server.js
import express from 'express';
import multer from 'multer';
import path from 'path';
const app = express();
import cors from 'cors';

const upload = multer({ dest: 'public/models/' });

app.use(express.static('public'));
app.use(cors({
  origin: '*'
}));

app.post('/api/upload', upload.single('model'), (req, res) => {
  const fileUrl = `${req.protocol}://${req.get('host')}/models/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.listen(3000, () => console.log('Server running on port 3000'));