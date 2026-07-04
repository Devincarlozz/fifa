const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function applyAdjustments() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;
    const client = new OAuth2Client({ clientId: config.user.azp });
    client.setCredentials({ refresh_token: tokenInfo.refresh_token, access_token: tokenInfo.access_token });
    const db = new Firestore({ projectId: 'fifa-69f1e', authClient: client });

    // Define target adjustments
    const adjustments = [
      { name: 'Vamadev', bonusPoints: 22 },
      { name: 'Favas vn', bonusPoints: 16 },
      { name: 'Abhay Krishnan', bonusPoints: 22 },
      { name: 'Mohammed Sharhan', bonusPoints: 25 },
      // Handle the 'student student' with ~131 points
      { name: 'student student', bonusPoints: 3, checkScore: 131 }
    ];

    console.log('🔄 Applying point adjustments in Firestore...');

    for (const adj of adjustments) {
      const usersSnap = await db.collection('users').where('name', '==', adj.name).get();
      if (usersSnap.empty) {
        console.log(`❌ User "${adj.name}" not found`);
        continue;
      }

      let targetDoc = null;
      if (usersSnap.size > 1 && adj.checkScore !== undefined) {
        // Resolve duplicates by checking points close to checkScore
        for (const docSnap of usersSnap.docs) {
          const u = docSnap.data();
          if (Math.abs((u.totalPoints || 0) - adj.checkScore) < 15) {
            targetDoc = docSnap;
            break;
          }
        }
      } else {
        targetDoc = usersSnap.docs[0];
      }

      if (!targetDoc) {
        console.log(`❌ Could not resolve unique user for "${adj.name}"`);
        continue;
      }

      console.log(`👤 Found user: ${adj.name} (uid: ${targetDoc.id}) | Current: ${targetDoc.data().totalPoints} | Setting bonusPoints: ${adj.bonusPoints}`);
      await db.collection('users').doc(targetDoc.id).update({
        bonusPoints: adj.bonusPoints
      });
    }

    console.log('\n✅ Adjustments written successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

applyAdjustments();
