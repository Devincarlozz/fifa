import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { squadData } from '../utils/tournamentData';

export async function syncCustomPlayers() {
  if (!db) return;
  try {
    const querySnapshot = await getDocs(collection(db, 'custom_players'));
    querySnapshot.forEach((docSnap) => {
      const player = docSnap.data();
      const { country, name, position, number, price } = player;
      if (country && name) {
        if (!squadData[country]) {
          squadData[country] = [];
        }
        
        // Find existing player by name (case-insensitive)
        const idx = squadData[country].findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        const updatedPlayer = {
          name,
          position,
          number: String(number),
          price: parseFloat(price) || 5.0
        };
        
        if (idx > -1) {
          squadData[country][idx] = {
            ...squadData[country][idx],
            ...updatedPlayer
          };
        } else {
          squadData[country].push(updatedPlayer);
        }
      }
    });
    console.log("Custom players synced successfully.");
  } catch (err) {
    console.error("Failed to sync custom players:", err);
  }
}

export async function saveCustomPlayer(playerData) {
  if (!db) return;
  const { country, name, position, number, price } = playerData;
  const docId = `${country.replace(/\s+/g, '_')}_${name.replace(/\s+/g, '_')}`;
  const docRef = doc(db, 'custom_players', docId);
  
  const payload = {
    country,
    name,
    position,
    number: String(number),
    price: parseFloat(price) || 5.0,
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(docRef, payload);
  
  // Also update global squadData in-memory immediately
  if (!squadData[country]) {
    squadData[country] = [];
  }
  const idx = squadData[country].findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  if (idx > -1) {
    squadData[country][idx] = {
      ...squadData[country][idx],
      ...payload
    };
  } else {
    squadData[country].push(payload);
  }
}

