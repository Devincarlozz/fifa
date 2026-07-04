import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

async function resetDatabase() {
  try {
    console.log("Logging in as admin...");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@rit.ac.in";
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD is not set in the environment variables!");
    }
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log("Logged in successfully!");

    // 1. Reset all users' points
    console.log("\nResetting users points...");
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnap.size} users.`);
    for (const userDoc of usersSnap.docs) {
      console.log(`Resetting points for user: ${userDoc.data().name || userDoc.id}`);
      await updateDoc(doc(db, 'users', userDoc.id), {
        totalPoints: 0,
        predictionsCount: 0,
        dreamTeamPoints: 0
      });
    }
    console.log("Users reset complete.");

    // 2. Delete all predictions
    console.log("\nDeleting all predictions...");
    const predictionsSnap = await getDocs(collection(db, 'predictions'));
    console.log(`Found ${predictionsSnap.size} predictions to delete.`);
    for (const predDoc of predictionsSnap.docs) {
      console.log(`Deleting prediction: ${predDoc.id}`);
      await deleteDoc(doc(db, 'predictions', predDoc.id));
    }
    console.log("Predictions deletion complete.");

    // 3. Delete all dream teams or reset them
    console.log("\nDeleting all dream teams...");
    const dreamTeamsSnap = await getDocs(collection(db, 'dream_teams'));
    console.log(`Found ${dreamTeamsSnap.size} dream teams to delete.`);
    for (const dtDoc of dreamTeamsSnap.docs) {
      console.log(`Deleting dream team: ${dtDoc.id}`);
      await deleteDoc(doc(db, 'dream_teams', dtDoc.id));
    }
    console.log("Dream teams deletion complete.");

    console.log("\nDatabase reset successfully completed!");
  } catch (err) {
    console.error("Error resetting database:", err);
  }
}

resetDatabase();
