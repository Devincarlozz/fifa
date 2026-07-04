const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function inspectMatches() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    console.log('Fetching Round of 32 matches...');
    const matchesSnap = await db.collection('matches').where('stage', '==', 'Round of 32').get();
    console.log(`Found ${matchesSnap.size} matches:`);
    
    matchesSnap.forEach(docSnap => {
      const m = docSnap.data();
      console.log(`- Match ID: ${docSnap.id} | ${m.homeTeam?.name} vs ${m.awayTeam?.name} | Confirmed: ${m.confirmed} | Result:`, m.confirmedResult, '| Status:', m.status);
    });
  } catch (err) {
    console.error(err);
  }
}

inspectMatches();
