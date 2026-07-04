const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function inspectPredsDetail() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    const ids = ['wc2026_073', 'wc2026_074', 'wc2026_075', 'wc2026_076'];
    for (const id of ids) {
      const matchDoc = await db.collection('matches').doc(id).get();
      const m = matchDoc.data();
      console.log(`\n=================== MATCH ${id} ===================`);
      console.log(`Teams: ${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
      console.log(`Actual Result: ${m.confirmedResult?.homeGoals}-${m.confirmedResult?.awayGoals} (MOTM: ${m.confirmedMOTM})`);
      if (m.confirmedPenaltyScore) {
        console.log(`Actual Penalty: ${m.confirmedPenaltyScore.home}-${m.confirmedPenaltyScore.away}`);
      }

      const predsSnap = await db.collection('predictions').where('matchId', '==', id).get();
      console.log(`Predictions (${predsSnap.size}):`);
      predsSnap.forEach(pDoc => {
        const p = pDoc.data();
        console.log(`  - User: ${p.userId} | Predicted: ${p.homeGoals}-${p.awayGoals} | MOTM: ${p.manOfTheMatch} | PenWinner: ${p.predictedPenaltyWinner} | Points Earned: ${p.pointsEarned}`);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

inspectPredsDetail();
