const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function inspectMatchesDetail() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    const ids = ['wc2026_073', 'wc2026_074', 'wc2026_075', 'wc2026_076'];
    for (const id of ids) {
      const docSnap = await db.collection('matches').doc(id).get();
      if (docSnap.exists) {
        console.log(`\nMatch ${id}:`, JSON.stringify(docSnap.data(), null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

inspectMatchesDetail();
