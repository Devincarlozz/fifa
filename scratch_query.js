import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Simple manual .env parser for Node environment execution
try {
  const envPath = './.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn("Could not read .env file:", e);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking matches without login...");
    const matchesSnap = await getDocs(collection(db, 'matches'));
    console.log(`Found ${matchesSnap.size} matches.`);
    const now = new Date();
    console.log(`Current system time: ${now.toISOString()} (${now.toString()})`);
    matchesSnap.forEach(snap => {
      const data = snap.data();
      const kickoff = data.kickoffTime?.toDate ? data.kickoffTime.toDate() : new Date(data.kickoffTime);
      const diff = kickoff.getTime() - now.getTime();
      console.log(`Match ID: ${snap.id} | Kickoff: ${kickoff.toISOString()} | Diff: ${diff}ms | Status: ${data.status} | Teams: ${data.homeTeam?.name} vs ${data.awayTeam?.name}`);
    });
  } catch (err) {
    console.error("Error querying matches:", err);
  } finally {
    process.exit(0);
  }
}

check();
