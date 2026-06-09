// src/utils/seeder.js
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { fixtureData } from './tournamentData';

export async function seedDatabase(force = false) {
  try {
    if (!db) {
      console.log("Database is not connected.");
      return { success: true, count: fixtureData.length, alreadySeeded: true };
    }

    if (!force) {
      const matchesQuerySnapshot = await getDocs(collection(db, 'matches'));
      if (!matchesQuerySnapshot.empty) {
        console.log("Matches are already seeded.");
        return { success: true, count: matchesQuerySnapshot.size, alreadySeeded: true };
      }
    }

    console.log(`Seeding initial ${fixtureData.length} tournament matches into Firestore...`);
    
    // Seed in batches or iterate
    for (const match of fixtureData) {
      const matchDoc = {
        ...match,
        id: match.matchId,
        kickoffTime: new Date(match.kickoffTimeStr),
        confirmedAt: match.confirmedAt ? new Date(match.confirmedAt) : null
      };
      
      // Clean up helper key
      delete matchDoc.kickoffTimeStr;

      await setDoc(doc(db, 'matches', match.matchId), matchDoc);
    }

    console.log("Database seeded successfully with official tournament fixtures.");
    return { success: true, count: fixtureData.length, alreadySeeded: false };
  } catch (error) {
    console.error("Error seeding matches:", error);
    throw error;
  }
}
