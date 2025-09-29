const express = require('express');
const Client = require('ssh2-sftp-client');
const { Transform } = require('stream');
const path = require('path');

const app = express();
const sftpConfig = {
  host: '0.tcp.ngrok.io',
  port: 11882,
  username: 'krishnareddy',
  password: 'Krishna7879',
};
const REMOTE_PATH = '/Users/krishnareddy/Documents';

// Helper: Transform stream to convert chunks to base64
class Base64Transform extends Transform {
  constructor(options) {
    super(options);
  }
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString('base64'));
    callback();
  }
}

// List files
app.get('/files', async (req, res) => {
  const sftp = new Client();
  try {
    await sftp.connect(sftpConfig);
    const files = await sftp.list(REMOTE_PATH);
    await sftp.end();
    res.json({ files: files.map(f => f.name) });
  } catch (err) {
    console.error('Error listing files:', err.message);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Download file streaming
app.get('/file/:filename', async (req, res) => {
  const { filename } = req.params;
  const remoteFilePath = path.posix.join(REMOTE_PATH, filename);
  const sftp = new Client();

  try {
    await sftp.connect(sftpConfig);

    // Get a readable stream from SFTP
    const sftpStream = await sftp.get(remoteFilePath, null, { stream: true, highWaterMark: 64 * 1024 });

    // Convert to base64 on the fly
    const base64Stream = new Base64Transform();

    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    // Start JSON output
    res.write(`{"filename":"${filename}","content":"`);

    // Pipe SFTP -> Base64 -> Response
    sftpStream.pipe(base64Stream).pipe(res, { end: false });

    base64Stream.on('end', async () => {
      res.write(`"}`); // close JSON
      res.end();
      await sftp.end();
    });

    // Handle errors
    sftpStream.on('error', async (err) => {
      console.error('SFTP stream error:', err);
      res.status(500).end();
      await sftp.end();
    });

    base64Stream.on('error', async (err) => {
      console.error('Base64 transform error:', err);
      res.status(500).end();
      await sftp.end();
    });

  } catch (err) {
    console.error('Error downloading file:', err.message);
    res.status(500).json({ error: 'Failed to download file' });
    await sftp.end();
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API listening at http://localhost:${PORT}`));
