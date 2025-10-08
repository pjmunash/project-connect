const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/[^a-z0-9\.\-]/gi,'_')) }
});

const upload = multer({ storage });
const router = express.Router();

router.post('/resume', upload.single('resume'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
