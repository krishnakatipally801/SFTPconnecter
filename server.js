const express = require('express');
const Client = require('ssh2-sftp-client');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const sftp = new Client();

// Update with your own details
const sftpConfig = {
  host: '0.tcp.ngrok.io',
  port: 11882,
  username: 'krishnareddy',
  password: 'Krishna7879', // or use privateKey
};

const REMOTE_PATH = '/Users/krishnareddy/Documents'; // folder on your Mac

// Endpoint 1: List file names
app.get('/files', async (req, res) => {
  try {
    await sftp.connect(sftpConfig);
    const files = await sftp.list(REMOTE_PATH);
    await sftp.end();
    
    const filenames = files.map(file => file.name);
    res.json({ files: filenames });
  } catch (err) {
    console.error('Error listing files:', err.message);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Endpoint 2: Download file by name
app.get('/file/:filename', async (req, res) => {
  const { filename } = req.params;
  const remoteFilePath = path.posix.join(REMOTE_PATH, filename);

  try {
    await sftp.connect(sftpConfig);
    
    // Download file to buffer
    const buffer = await sftp.get(remoteFilePath);
    await sftp.end();

    const base64 = buffer.toString('base64');

    res.json({
      filename,
      content: base64
    });
  } catch (err) {
    console.error('Error downloading file:', err.message);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening at http://localhost:${PORT}`);
});
