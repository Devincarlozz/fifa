const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function inspectMatchesGrouped() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    const predsSnap = await db.collection('predictions').get();
    const counts = {};
    predsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const mId = p.matchId;
      counts[mId] = (counts[mId] || 0) + 1;
    });

    console.log('Predictions count by matchId:');
    Object.entries(counts).sort().forEach(([mId, count]) => {
      console.log(`- Match ${mId}: ${count} predictions`);
    });
  } catch (err) {
    console.error(err);
  }
}

inspectMatchesGrouped();
