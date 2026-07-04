const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function inspect() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    console.log('Fetching users sorted by totalPoints...');
    const usersSnap = await db.collection('users').orderBy('totalPoints', 'desc').limit(15).get();
    
    usersSnap.forEach(uDoc => {
      const u = uDoc.data();
      console.log(`👤 Name: ${u.name} | Total: ${u.totalPoints} | PredsCount: ${u.predictionsCount} | PredPts: ${u.totalPoints - (u.dreamTeamPointsPhase1 || u.dreamTeamPoints || 0) - (u.dreamTeamPointsPhase2 || 0) - (u.awardsPoints || 0)} | DT1: ${u.dreamTeamPointsPhase1 || u.dreamTeamPoints || 0} | DT2: ${u.dreamTeamPointsPhase2 || 0} | Awards: ${u.awardsPoints || 0}`);
    });
  } catch (err) {
    console.error(err);
  }
}

inspect();
