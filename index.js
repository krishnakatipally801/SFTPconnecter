require('dotenv').config();
const express = require('express');
const SftpClient = require('ssh2-sftp-client');
const morgan = require('morgan');
const path = require('path');

const app = express();
app.use(express.json());
app.use(morgan('combined'));

const PORT = process.env.PORT || 3000;
const SFTP_BASE_PATH = process.env.SFTP_BASE_PATH || '/';
const API_KEY = process.env.API_KEY || null;

// Simple API key middleware
function requireApiKey(req, res, next) {
  if (!API_KEY) return next(); // open if no API key
  const key = req.header('x-api-key') || req.query.api_key;
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Helper to create SFTP client
function getSftpClient() {
  const sftp = new SftpClient();
  const config = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT ? parseInt(process.env.SFTP_PORT, 10) : 22,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
  };
  return { sftp, config };
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// GET /list-files?folder=<folder-name>
app.get('/list-files', requireApiKey, async (req, res) => {
  const folderName = req.query.folder;
  if (!folderName) return res.status(400).json({ error: 'Missing folder parameter' });

  const remotePath = path.posix.join(SFTP_BASE_PATH, folderName);
  const { sftp, config } = getSftpClient();

  try {
    await sftp.connect(config);
    const list = await sftp.list(remotePath);

    // Only return files with name & extension
    const files = list
      .filter(f => f.type === '-') // only files, skip directories
      .map(f => ({
        name: f.name,
        extension: path.extname(f.name).substring(1), // remove dot
        size: f.size
      }));

    await sftp.end();
    res.json({ folder: folderName, files });
  } catch (err) {
    try { await sftp.end(); } catch(e) {}
    console.error('Error listing files:', err);
    res.status(500).json({ error: 'Failed to list files', details: err.message });
  }
});

app.listen(PORT, () => console.log(`SFTP API running on port ${PORT}`));
