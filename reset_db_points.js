import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

async function resetDatabase() {
  try {
    console.log("Logging in as admin...");
    await signInWithEmailAndPassword(auth, "admin@rit.ac.in", "admin123");
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
