const Client = require('ssh2-sftp-client');
const sftp = new Client();

sftp.connect({
  host: '0.tcp.ngrok.io',
  port: 18716,
  username: 'krishnareddy',         // Replace with your Mac's username
  password: 'Krishna7879',         // Or use privateKey instead
})
.then(() => {
  console.log('✅ Connected to SFTP');
  return sftp.list('//Users/krishnareddy'); // Example path
})
.then(data => {
  console.log('📁 Directory listing:', data);
  return sftp.end();
})
.catch(err => {
  console.error('❌ SFTP Error:', err.message);
});
