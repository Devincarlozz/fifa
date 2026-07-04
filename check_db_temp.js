import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple manual .env parser for Node environment execution
try {
  const envPath = path.resolve(__dirname, '.env');
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
const auth = getAuth(app);

async function check() {
  try {
    console.log("Logging in as admin...");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@rit.ac.in";
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD is not set in the environment variables!");
    }
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log("Logged in successfully!");

    console.log("\nChecking matches...");
    const matchesSnap = await getDocs(collection(db, 'matches'));
    console.log(`Found ${matchesSnap.size} matches.`);
    matchesSnap.forEach(snap => {
      const data = snap.data();
      const kickoff = data.kickoffTime?.toDate ? data.kickoffTime.toDate().toISOString() : data.kickoffTime;
      console.log(`Match ID: ${snap.id} | Kickoff: ${kickoff} | Status: ${data.status} | Teams: ${data.homeTeam} vs ${data.awayTeam}`);
    });

    console.log("\nChecking dream_teams rules and system configuration...");
    const configDoc = await getDoc(doc(db, 'system', 'settings'));
    if (configDoc.exists()) {
      console.log("System settings:", configDoc.data());
    } else {
      console.log("No system settings document found.");
    }
  } catch (err) {
    console.error("Error running database inspection:", err);
  }
}

check();
