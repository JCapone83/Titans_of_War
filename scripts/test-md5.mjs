import crypto from 'crypto';
import https from 'https';

function getMd5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    https.get(url, { headers }, (res) => {
      resolve(res.statusCode);
    }).on('error', () => {
      resolve(500);
    });
  });
}

async function testSong(filename) {
  const md5 = getMd5(filename);
  const h1 = md5[0];
  const h2 = md5.substring(0, 2);
  
  // Standard OGG path
  const oggUrl = `https://upload.wikimedia.org/wikipedia/commons/${h1}/${h2}/${filename}`;
  // Transcoded MP3 path
  const mp3Url = `https://upload.wikimedia.org/wikipedia/commons/transcoded/${h1}/${h2}/${filename}/${filename}.mp3`;
  
  const oggStatus = await checkUrl(oggUrl);
  const mp3Status = await checkUrl(mp3Url);
  
  console.log(`Song: ${filename}`);
  console.log(`  OGG: ${oggStatus} -> ${oggUrl}`);
  console.log(`  MP3: ${mp3Status} -> ${mp3Url}`);
}

async function main() {
  await testSong("Yellow_Rose_Of_Texas.ogg");
  await testSong("Tenting_Tonight_on_Old_Camp_Ground.ogg");
  await testSong("The_Battle_Hymn_of_the_Republic.ogg");
}

main().catch(console.error);
