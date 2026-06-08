const https = require('https');
https.get('https://image.pollinations.ai/prompt/a%20beautiful%20star?width=800&height=500&nologo=true', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
