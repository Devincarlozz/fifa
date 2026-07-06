import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { squadData } from '../utils/tournamentData';
import { callSavePlayer, callDeletePlayer } from './adminFunctions';

export function syncCustomPlayers() {
  if (!db) return Promise.resolve();
  
  return new Promise((resolve) => {
    let resolved = false;
    onSnapshot(collection(db, 'custom_players'), (querySnapshot) => {
      querySnapshot.forEach((docSnap) => {
        const player = docSnap.data();
        const { country, name, position, number, price, deleted } = player;
        if (country && name) {
          if (!squadData[country]) {
            squadData[country] = [];
          }
          
          if (deleted) {
            squadData[country] = squadData[country].filter(p => p.name.toLowerCase() !== name.toLowerCase());
            return;
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
      console.log("Custom players synced in real-time.");
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, (err) => {
      console.error("Failed to sync custom players in real-time:", err);
      if (!resolved) {
        resolved = true;
        resolve();
      }
    });
  });
}

export async function saveCustomPlayer(playerData, oldName) {
  const { country, name, position, number, price } = playerData;
  
  // Call Cloud Function to write securely
  await callSavePlayer({
    country,
    name: name.trim(),
    position,
    number: String(number),
    price: parseFloat(price) || 5.0,
    oldName: oldName ? oldName.trim() : null
  });
  
  // If editing and player name has changed, delete the old player from local memory
  if (oldName && oldName.trim().toLowerCase() !== name.trim().toLowerCase()) {
    // Remove from in-memory squadData
    if (squadData[country]) {
      squadData[country] = squadData[country].filter(p => p.name.toLowerCase() !== oldName.trim().toLowerCase());
    }
  }
  
  // Also update global squadData in-memory immediately
  if (!squadData[country]) {
    squadData[country] = [];
  }
  
  const payload = {
    country,
    name: name.trim(),
    position,
    number: String(number),
    price: parseFloat(price) || 5.0
  };

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

export async function deleteCustomPlayer(country, name) {
  // Call Cloud Function to delete securely
  await callDeletePlayer(country, name);
  
  // Also remove from local in-memory squadData immediately
  if (squadData[country]) {
    squadData[country] = squadData[country].filter(p => p.name.toLowerCase() !== name.trim().toLowerCase());
  }
}

