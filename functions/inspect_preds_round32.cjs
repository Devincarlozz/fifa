const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function inspectPreds() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    const ids = ['wc2026_073', 'wc2026_074', 'wc2026_075', 'wc2026_076'];
    for (const id of ids) {
      const predsSnap = await db.collection('predictions').where('matchId', '==', id).get();
      let pending = 0;
      let calculated = 0;
      let totalPts = 0;
      
      predsSnap.forEach(docSnap => {
        const p = docSnap.data();
        if (p.pointsEarned === undefined || p.pointsEarned === null) {
          pending++;
        } else {
          calculated++;
          totalPts += p.pointsEarned;
        }
      });
      console.log(`Match ${id}: Calculated: ${calculated} | Pending/Null: ${pending} | Total Points Awarded: ${totalPts}`);
    }
  } catch (err) {
    console.error(err);
  }
}

inspectPreds();
