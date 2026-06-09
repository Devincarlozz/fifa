import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCOufxbWJplBY8tL035Ags9wjCbgzH_cqU",
  authDomain: "fifa-69f1e.firebaseapp.com",
  projectId: "fifa-69f1e",
  storageBucket: "fifa-69f1e.firebasestorage.app",
  messagingSenderId: "71066011642",
  appId: "1:71066011642:web:6bdccaea5ed4af96460643"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function check() {
  try {
    console.log("Logging in as admin...");
    await signInWithEmailAndPassword(auth, "admin@rit.ac.in", "admin123");
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
