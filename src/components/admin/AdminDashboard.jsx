import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { processMatchResults } from '../../utils/pointsCalc';
import { Shield, CheckCircle, Users, Calendar, PlusCircle, Trash2, Edit3, Award, Clock, ArrowRight, Save, UserCheck, X, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { seedDatabase } from '../../utils/seeder';
import { squadData } from '../../utils/tournamentData';
import DreamTeamRankingsPanel from './DreamTeamRankingsPanel';
import { saveCustomPlayer } from '../../services/playerService';

const countryFlags = {
  'Algeria': '🇩🇿', 'Argentina': '🇦🇷', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
  'Bosnia And Herzegovina': '🇧🇦', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Cape Verde': '🇨🇻',
  'Colombia': '🇨🇴', 'Congo DR': '🇨🇩', 'Croatia': '🇭🇷', 'Curacao': '🇨🇼', 'Czech Republic': '🇨🇿',
  'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'Ghana': '🇬🇭', 'Haiti': '🇭🇹', 'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Ivory Coast': '🇨🇮',
  'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'South Korea': '🇰🇷', 'Mexico': '🇲🇽', 'Morocco': '🇲🇦',
  'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Norway': '🇳🇴', 'Panama': '🇵🇦', 'Paraguay': '🇵🇾',
  'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Senegal': '🇸🇳',
  'South Africa': '🇿🇦', 'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Tunisia': '🇹🇳',
  'Turkey': '🇹🇷', 'USA': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿'
};

const countryCodes = {
  'Algeria': 'ALG', 'Argentina': 'ARG', 'Australia': 'AUS', 'Austria': 'AUT', 'Belgium': 'BEL',
  'Bosnia And Herzegovina': 'BIH', 'Brazil': 'BRA', 'Canada': 'CAN', 'Cape Verde': 'CPV',
  'Colombia': 'COL', 'Congo DR': 'COD', 'Croatia': 'CRO', 'Curacao': 'CUW', 'Czech Republic': 'CZE',
  'Ecuador': 'ECU', 'Egypt': 'EGY', 'England': 'ENG', 'France': 'FRA', 'Germany': 'GER',
  'Ghana': 'GHA', 'Haiti': 'HAI', 'Iran': 'IRN', 'Iraq': 'IRQ', 'Ivory Coast': 'CIV',
  'Japan': 'JPN', 'Jordan': 'JOR', 'South Korea': 'KOR', 'Mexico': 'MEX', 'Morocco': 'MAR',
  'Netherlands': 'NED', 'New Zealand': 'NZL', 'Norway': 'NOR', 'Panama': 'PAN', 'Paraguay': 'PAR',
  'Portugal': 'POR', 'Qatar': 'QAT', 'Saudi Arabia': 'KSA', 'Scotland': 'SCO', 'Senegal': 'SEN',
  'South Africa': 'RSA', 'Spain': 'ESP', 'Sweden': 'SWE', 'Switzerland': 'SUI', 'Tunisia': 'TUN',
  'Turkey': 'TUR', 'USA': 'USA', 'Uruguay': 'URU', 'Uzbekistan': 'UZB'
};

const twoLetterCodes = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at', 'Belgium': 'be',
  'Bosnia And Herzegovina': 'ba', 'Brazil': 'br', 'Canada': 'ca', 'Cape Verde': 'cv',
  'Colombia': 'co', 'Congo DR': 'cd', 'Croatia': 'hr', 'Curacao': 'cw', 'Czech Republic': 'cz',
  'Ecuador': 'ec', 'Egypt': 'eg', 'England': 'gb-eng', 'France': 'fr', 'Germany': 'de',
  'Ghana': 'gh', 'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq', 'Ivory Coast': 'ci',
  'Japan': 'jp', 'Jordan': 'jo', 'South Korea': 'kr', 'Mexico': 'mx', 'Morocco': 'ma',
  'Netherlands': 'nl', 'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa', 'Paraguay': 'py',
  'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Scotland': 'gb-sct', 'Senegal': 'sn',
  'South Africa': 'za', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch', 'Tunisia': 'tn',
  'Turkey': 'tr', 'USA': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz'
};

const sortedTeams = Object.keys(squadData).sort();

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resolve');
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixtureSearch, setFixtureSearch] = useState('');

  // Form states for confirmation / resolution
  const [confirmingMatchId, setConfirmingMatchId] = useState(null);
  const [confirmedHomeGoals, setConfirmedHomeGoals] = useState('');
  const [confirmedAwayGoals, setConfirmedAwayGoals] = useState('');
  const [confirmedMOTM, setConfirmedMOTM] = useState('');
  const [confirmedHomePenalties, setConfirmedHomePenalties] = useState('');
  const [confirmedAwayPenalties, setConfirmedAwayPenalties] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeSquad, setActiveSquad] = useState([]);
  const [loadingSquad, setLoadingSquad] = useState(false);

  // Users & Predictions tab states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPredictions, setUserPredictions] = useState([]);
  const [loadingUserPreds, setLoadingUserPreds] = useState(false);

  // Player Management Tab states
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isAddingNewPlayer, setIsAddingNewPlayer] = useState(false);
  const [formPlayerName, setFormPlayerName] = useState('');
  const [formPlayerNumber, setFormPlayerNumber] = useState('');
  const [formPlayerPosition, setFormPlayerPosition] = useState('FW');
  const [formPlayerPrice, setFormPlayerPrice] = useState('5.0');

  // Create Fixture Form states
  const [newHomeName, setNewHomeName] = useState('');
  const [newHomeCode, setNewHomeCode] = useState('');
  const [newHomeCrest, setNewHomeCrest] = useState('');
  const [newAwayName, setNewAwayName] = useState('');
  const [newAwayCode, setNewAwayCode] = useState('');
  const [newAwayCrest, setNewAwayCrest] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newStage, setNewStage] = useState('GROUP_STAGE');
  const [newKickoff, setNewKickoff] = useState('');

  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editHomeName, setEditHomeName] = useState('');
  const [editHomeCode, setEditHomeCode] = useState('');
  const [editHomeCrest, setEditHomeCrest] = useState('');
  const [editAwayName, setEditAwayName] = useState('');
  const [editAwayCode, setEditAwayCode] = useState('');
  const [editAwayCrest, setEditAwayCrest] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStage, setEditStage] = useState('GROUP_STAGE');
  const [editKickoff, setEditKickoff] = useState('');
  const [editStatus, setEditStatus] = useState('SCHEDULED');
  const [editHomeGoals, setEditHomeGoals] = useState('0');
  const [editAwayGoals, setEditAwayGoals] = useState('0');

  const editFormRef = useRef(null);

  // Scroll to edit form when active
  useEffect(() => {
    if (editingMatchId) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingMatchId]);

  // 1. Listen to matches in real-time
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'matches'), orderBy('kickoffTime', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const matchesData = [];
      querySnapshot.forEach((doc) => {
        matchesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches in real-time:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch players once on mount and set up 30s polling
  useEffect(() => {
    if (!db) return;
    
    const fetchPlayers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const playersData = [];
        querySnapshot.forEach((doc) => {
          playersData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setPlayers(playersData);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch predictions of a specific user
  const handleFetchUserPredictions = async (userId) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setUserPredictions([]);
      return;
    }
    setSelectedUser(userId);
    setLoadingUserPreds(true);
    try {
      const q = query(collection(db, 'predictions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const predsData = [];
      querySnapshot.forEach((doc) => {
        predsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setUserPredictions(predsData);
    } catch (err) {
      console.error("Error fetching user predictions:", err);
    } finally {
      setLoadingUserPreds(false);
    }
  };

  const getMatchDetails = (matchId) => {
    return matches.find(m => m.id === matchId || m.matchId === matchId);
  };

  // Open confirm form
  const loadSquadForMatch = async (match) => {
    setLoadingSquad(true);
    try {
      const homeName = match.homeTeam?.name;
      const awayName = match.awayTeam?.name;
      
      const homeSquad = squadData[homeName] || [];
      const awaySquad = squadData[awayName] || [];
      
      const homeLabeled = homeSquad.map(p => ({
        id: p.number,
        name: p.name,
        position: p.position || 'Player',
        team: match.homeTeam.code || 'HOME'
      }));
      
      const awayLabeled = awaySquad.map(p => ({
        id: p.number,
        name: p.name,
        position: p.position || 'Player',
        team: match.awayTeam.code || 'AWAY'
      }));
      
      setActiveSquad([...homeLabeled, ...awayLabeled]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSquad(false);
    }
  };

  const handleOpenConfirm = (match) => {
    setConfirmingMatchId(match.id);
    setConfirmedHomeGoals(match.liveScore?.home?.toString() || '0');
    setConfirmedAwayGoals(match.liveScore?.away?.toString() || '0');
    setConfirmedMOTM(match.confirmedMOTM || '');
    setConfirmedHomePenalties(match.confirmedPenaltyScore?.home?.toString() || '');
    setConfirmedAwayPenalties(match.confirmedPenaltyScore?.away?.toString() || '');
    setAdminError(null);
    setSuccessMessage('');
    loadSquadForMatch(match);
  };

  // Triggered when resolving match and awarding points
  const confirmAwardPointsAction = async () => {
    if (!confirmingMatchId) return;

    if (confirmedHomeGoals === '' || confirmedAwayGoals === '' || !confirmedMOTM) {
      setAdminError("Please fill out all results (goals, MOTM).");
      return;
    }

    const match = getMatchDetails(confirmingMatchId);
    const isKnockout = match && [
      'Round of 32',
      'Round of 16',
      'Quarter-finals',
      'Semi-finals',
      'Play-off for third place',
      'Final'
    ].includes(match.stage);

    const isDraw = parseInt(confirmedHomeGoals) === parseInt(confirmedAwayGoals);

    if (isKnockout && isDraw) {
      if (confirmedHomePenalties === '' || confirmedAwayPenalties === '') {
        setAdminError("Please fill out penalty shootout scores for knockout draws.");
        return;
      }
      if (parseInt(confirmedHomePenalties) === parseInt(confirmedAwayPenalties)) {
        setAdminError("Penalty shootout cannot end in a draw. One team must win.");
        return;
      }
    }

    setIsSubmitting(true);
    setAdminError(null);
    setSuccessMessage('');

    try {
      const adminResult = {
        finalScore: {
          home: parseInt(confirmedHomeGoals),
          away: parseInt(confirmedAwayGoals)
        },
        penaltyScore: isKnockout && isDraw ? {
          home: parseInt(confirmedHomePenalties),
          away: parseInt(confirmedAwayPenalties)
        } : null,
        manOfTheMatch: confirmedMOTM.trim(),
        confirmedBy: user?.email || 'admin@rit.ac.in'
      };

      // Call results calculator and leaderboard updater
      await processMatchResults(confirmingMatchId, adminResult);

      setSuccessMessage("✅ Results confirmed! Points distributed and leaderboard updated.");
      setConfirmingMatchId(null);
    } catch (err) {
      console.error(err);
      setAdminError(err.message || "Failed to confirm result.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Fixture Form Submit
  const handleCreateFixture = async (e) => {
    e.preventDefault();
    if (!newHomeName || !newHomeCode || !newAwayName || !newAwayCode || !newKickoff) {
      alert("Please fill in home/away team details and kickoff time.");
      return;
    }

    if (!user) {
      alert("Error: You must be logged in to create a fixture.");
      return;
    }

    setIsSubmitting(true);
    try {
      const matchId = `match_${Date.now()}`;
      const matchRef = doc(db, 'matches', matchId);

      const newFixture = {
        matchId,
        homeTeam: {
          name: newHomeName.trim(),
          code: newHomeCode.trim().toUpperCase(),
          crest: newHomeCrest.trim() || null,
          flag: countryFlags[newHomeName] || '⚽'
        },
        awayTeam: {
          name: newAwayName.trim(),
          code: newAwayCode.trim().toUpperCase(),
          crest: newAwayCrest.trim() || null,
          flag: countryFlags[newAwayName] || '⚽'
        },
        kickoffTime: new Date(newKickoff),
        venue: newVenue.trim() || 'Tournament Stadium',
        stage: newStage,
        status: 'SCHEDULED',
        liveScore: { home: 0, away: 0 },
        minute: null,
        goals: [],
        bookings: [],
        confirmed: false,
        confirmedResult: null,
        confirmedMOTM: null
      };

      await setDoc(matchRef, newFixture);

      setSuccessMessage("✅ New fixture created successfully!");
      // Reset form
      setNewHomeName('');
      setNewHomeCode('');
      setNewHomeCrest('');
      setNewAwayName('');
      setNewAwayCode('');
      setNewAwayCrest('');
      setNewVenue('');
      setNewKickoff('');
    } catch (err) {
      alert(`Error creating fixture: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate a sample fixture for test
  const handleGenerateSampleFixture = async () => {
    if (!user) {
      alert("Error: You must be logged in to generate a sample fixture.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      const matchId = `match_${Date.now()}`;
      const kickoffTime = new Date();
      kickoffTime.setHours(kickoffTime.getHours() + 2);

      const sampleFixture = {
        matchId,
        homeTeam: {
          name: "France",
          code: "FRA",
          crest: "https://crests.football-data.org/773.svg",
          flag: "🇫🇷"
        },
        awayTeam: {
          name: "England",
          code: "ENG",
          crest: "https://crests.football-data.org/770.svg",
          flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
        },
        kickoffTime: kickoffTime.toISOString(),
        venue: "Lusail Iconic Stadium",
        stage: "GROUP_STAGE",
        status: 'SCHEDULED',
        liveScore: { home: 0, away: 0 },
        minute: null,
        goals: [],
        bookings: [],
        confirmed: false,
        confirmedResult: null,
        confirmedMOTM: null
      };

      await setDoc(doc(db, 'matches', matchId), sampleFixture);
      setSuccessMessage("✅ Sample fixture (FRA vs ENG) created successfully!");
    } catch (err) {
      alert(`Error creating sample fixture: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleForceReseed = async () => {
    if (!window.confirm("Are you sure you want to re-seed all default matches? This will overwrite the 5 core matches with fresh dates, native Timestamp types, and the required schema properties.")) return;
    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      const result = await seedDatabase(true);
      setSuccessMessage(`🔄 Matches successfully re-seeded and updated!`);
      // Reload match list
      const q = query(collection(db, 'matches'), orderBy('kickoffTime', 'asc'));
      const querySnapshot = await getDocs(q);
      const matchesData = [];
      querySnapshot.forEach((doc) => {
        matchesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMatches(matchesData);
    } catch (err) {
      alert(`Error re-seeding matches: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearPlayerImages = async () => {
    if (!window.confirm("Are you sure you want to remove all player image URLs from the Firebase database? This action is irreversible.")) return;
    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      const querySnapshot = await getDocs(collection(db, 'custom_players'));
      let count = 0;
      for (const docSnap of querySnapshot.docs) {
        const docRef = doc(db, 'custom_players', docSnap.id);
        await updateDoc(docRef, {
          pictureUrl: ''
        });
        count++;
      }
      setSuccessMessage(`🗑️ Successfully cleared player image URLs for ${count} players in Firebase!`);
      // Also clear in-memory squadData pictureUrl values
      Object.keys(squadData).forEach(country => {
        squadData[country].forEach(player => {
          if ('pictureUrl' in player) {
            player.pictureUrl = '';
          }
        });
      });
    } catch (err) {
      console.error("Error clearing player image URLs:", err);
      alert(`Error clearing player image URLs: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit match status / bonus question
  const handleOpenEdit = (match) => {
    setEditingMatchId(match.id);
    setEditHomeName(match.homeTeam?.name || '');
    setEditHomeCode(match.homeTeam?.code || '');
    setEditHomeCrest(match.homeTeam?.crest || '');
    setEditAwayName(match.awayTeam?.name || '');
    setEditAwayCode(match.awayTeam?.code || '');
    setEditAwayCrest(match.awayTeam?.crest || '');
    
    // Convert kickoff timestamp to local datetime input string (YYYY-MM-DDTHH:MM)
    const kickoff = match.kickoffTime?.toDate ? match.kickoffTime.toDate() : new Date(match.kickoffTime);
    const pad = (n) => n.toString().padStart(2, '0');
    const localDateTimeStr = `${kickoff.getFullYear()}-${pad(kickoff.getMonth() + 1)}-${pad(kickoff.getDate())}T${pad(kickoff.getHours())}:${pad(kickoff.getMinutes())}`;
    setEditKickoff(localDateTimeStr);
    
    setEditVenue(match.venue || '');
    setEditStage(match.stage || 'GROUP_STAGE');
    setEditStatus(match.status || 'SCHEDULED');
    setEditHomeGoals(match.liveScore?.home?.toString() || '0');
    setEditAwayGoals(match.liveScore?.away?.toString() || '0');
  };

  // Save edit match status / bonus question
  const handleSaveMatchEdit = async (matchId) => {
    if (!db) {
      alert("Database is not connected.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const matchRef = doc(db, 'matches', matchId);
      
      const updatedFields = {
        homeTeam: {
          name: editHomeName,
          code: editHomeCode,
          crest: editHomeCrest,
          flag: countryFlags[editHomeName] || '🏳️'
        },
        awayTeam: {
          name: editAwayName,
          code: editAwayCode,
          crest: editAwayCrest,
          flag: countryFlags[editAwayName] || '🏳️'
        },
        kickoffTime: new Date(editKickoff),
        venue: editVenue,
        stage: editStage,
        liveScore: {
          home: parseInt(editHomeGoals) || 0,
          away: parseInt(editAwayGoals) || 0
        },
        status: editStatus
      };
      
      await updateDoc(matchRef, updatedFields);
      
      // Update local state matches
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updatedFields } : m));
      setEditingMatchId(null);
      setSuccessMessage("✅ Fixture updated successfully!");
    } catch (err) {
      console.error("Error editing match:", err);
      alert(`Error updating match: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a Match Fixture
  const handleDeleteFixture = async (matchId) => {
    if (!window.confirm("Are you sure you want to delete this fixture? This will delete all predictions for it as well.")) return;
    try {
      const matchRef = doc(db, 'matches', matchId);
      await deleteDoc(matchRef);
      setSuccessMessage("🗑️ Fixture deleted successfully!");
    } catch (err) {
      alert(`Error deleting fixture: ${err.message}`);
    }
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (!selectedPlayerTeam || !formPlayerName || !formPlayerNumber || !formPlayerPosition || !formPlayerPrice) {
      alert("Please fill in all player details.");
      return;
    }
    
    setIsSubmitting(true);
    setAdminError(null);
    setSuccessMessage('');
    try {
      await saveCustomPlayer({
        country: selectedPlayerTeam,
        name: formPlayerName.trim(),
        position: formPlayerPosition,
        number: formPlayerNumber.trim(),
        price: parseFloat(formPlayerPrice) || 5.0
      });
      setSuccessMessage(`✅ Player ${formPlayerName} saved successfully!`);
      setEditingPlayer(null);
      setIsAddingNewPlayer(false);
      setFormPlayerName('');
      setFormPlayerNumber('');
      setFormPlayerPosition('FW');
      setFormPlayerPrice('5.0');
    } catch (err) {
      console.error(err);
      setAdminError(err.message || "Failed to save player details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlayerClick = (player) => {
    setEditingPlayer(player);
    setIsAddingNewPlayer(false);
    setFormPlayerName(player.name);
    setFormPlayerNumber(player.number || '');
    setFormPlayerPosition(player.position || 'FW');
    setFormPlayerPrice(player.price?.toString() || '5.0');
  };

  const handleAddNewPlayerClick = () => {
    setEditingPlayer(null);
    setIsAddingNewPlayer(true);
    setFormPlayerName('');
    setFormPlayerNumber('');
    setFormPlayerPosition('FW');
    setFormPlayerPrice('5.0');
  };

  const resolvableMatches = matches.filter(m => !m.confirmed);
  const resolvedMatches = matches.filter(m => m.confirmed);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold tracking-wide">Initializing admin panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full page-enter">
      {/* Admin Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold uppercase tracking-wider text-white font-display">Admin Control Center</h2>
        </div>
        <div className="text-xs font-semibold text-gray-500 font-mono">
          SYSTEM ADMINISTRATOR
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-950/20 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center space-x-2 mb-4 shadow-lg">
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="bg-[#111827]/60 border border-white/5 p-1.5 rounded-2xl flex flex-wrap gap-2 select-none backdrop-blur-md">
        <button
          onClick={() => setActiveTab('resolve')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition duration-300 cursor-pointer border-none ${
            activeTab === 'resolve'
              ? 'bg-[#F5C518] text-[#0A0E1A] shadow-[0_0_15px_rgba(245,197,24,0.35)] scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Resolve Matches ({resolvableMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition duration-300 cursor-pointer border-none ${
            activeTab === 'create'
              ? 'bg-[#F5C518] text-[#0A0E1A] shadow-[0_0_15px_rgba(245,197,24,0.35)] scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create Fixture</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition duration-300 cursor-pointer border-none ${
            activeTab === 'players'
              ? 'bg-[#F5C518] text-[#0A0E1A] shadow-[0_0_15px_rgba(245,197,24,0.35)] scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Manage Players</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition duration-300 cursor-pointer border-none ${
            activeTab === 'users'
              ? 'bg-[#F5C518] text-[#0A0E1A] shadow-[0_0_15px_rgba(245,197,24,0.35)] scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users & Predictions ({players.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition duration-300 cursor-pointer border-none ${
            activeTab === 'fixtures'
              ? 'bg-[#F5C518] text-[#0A0E1A] shadow-[0_0_15px_rgba(245,197,24,0.35)] scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Fixture List ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dreamteam')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition duration-300 cursor-pointer border-none ${
            activeTab === 'dreamteam'
              ? 'bg-[#F5C518] text-[#0A0E1A] shadow-[0_0_15px_rgba(245,197,24,0.35)] scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Dream Team Rankings</span>
        </button>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. Resolve Matches Tab */}
      {activeTab === 'resolve' && (
        <div className="space-y-4">
          {resolvableMatches.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Queue Clear</h3>
              <p className="text-sm">No matches are currently awaiting resolution.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {resolvableMatches.map((match) => {
                const isKickoffPassed = match.kickoffTime?.toDate ? match.kickoffTime.toDate() < new Date() : new Date(match.kickoffTime) < new Date();
                
                return (
                  <div key={match.id} className="card relative overflow-hidden">
                    {/* Top status header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider ${
                          isKickoffPassed 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {isKickoffPassed ? 'Predictions Locked' : 'Open for Predictions'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {match.stage?.replace('_', ' ')} • {match.venue}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold font-sans">
                        KICKOFF: {match.kickoffTime ? new Date(match.kickoffTime.toDate ? match.kickoffTime.toDate() : match.kickoffTime).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) + ' IST' : 'TBD'}
                      </span>
                    </div>

                    {/* Team matchup row with input boxes */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 select-none">
                      {/* Home Team */}
                      <div className="flex-1 flex items-center gap-4 justify-end w-full">
                        <span className="text-right">
                          <span className="font-display text-lg font-black text-white block uppercase leading-tight">{match.homeTeam.code}</span>
                          <span className="text-[10px] text-gray-400 block font-sans truncate max-w-[120px]">{match.homeTeam.name}</span>
                        </span>
                        <div className="w-12 h-12 rounded-full border border-[#F5C518]/30 bg-[#1C2333] p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {match.homeTeam.crest ? (
                            <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xl">{match.homeTeam.flag || '⚽'}</span>
                          )}
                        </div>

                        {/* Score Input */}
                        <input
                          type="number"
                          min="0"
                          value={confirmingMatchId === match.id ? confirmedHomeGoals : ''}
                          onChange={(e) => {
                            if (confirmingMatchId !== match.id) handleOpenConfirm(match);
                            setConfirmedHomeGoals(e.target.value);
                          }}
                          placeholder="0"
                          className="w-14 bg-[#0A0E1A] border border-[#F5C518]/25 rounded-xl p-2.5 text-center font-mono font-bold text-lg text-[#F5C518] focus:outline-none focus:border-[#F5C518]"
                        />
                      </div>

                      <span className="text-gray-600 font-bold text-lg px-2">vs</span>

                      {/* Away Team */}
                      <div className="flex-1 flex items-center gap-4 justify-start w-full">
                        {/* Score Input */}
                        <input
                          type="number"
                          min="0"
                          value={confirmingMatchId === match.id ? confirmedAwayGoals : ''}
                          onChange={(e) => {
                            if (confirmingMatchId !== match.id) handleOpenConfirm(match);
                            setConfirmedAwayGoals(e.target.value);
                          }}
                          placeholder="0"
                          className="w-14 bg-[#0A0E1A] border border-[#F5C518]/25 rounded-xl p-2.5 text-center font-mono font-bold text-lg text-[#F5C518] focus:outline-none focus:border-[#F5C518]"
                        />

                        <div className="w-12 h-12 rounded-full border border-[#F5C518]/30 bg-[#1C2333] p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {match.awayTeam.crest ? (
                            <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xl">{match.awayTeam.flag || '⚽'}</span>
                          )}
                        </div>
                        <span className="text-left">
                          <span className="font-display text-lg font-black text-white block uppercase leading-tight">{match.awayTeam.code}</span>
                          <span className="text-[10px] text-gray-400 block font-sans truncate max-w-[120px]">{match.awayTeam.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Form fields for confirmation details (MOTM, Bonus) */}
                    {confirmingMatchId === match.id && (
                      <div className="space-y-4 bg-black/20 border border-white/5 rounded-xl p-4 mb-4">
                        <div className="w-full">
                          {/* MOTM Dropdown Selection */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                              Official Man of the Match
                            </label>
                            {loadingSquad ? (
                              <div className="flex items-center space-x-2 p-3 bg-[#0A0E1A] border border-white/10 rounded-xl">
                                <div className="w-4 h-4 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-gray-400">Loading squad lists...</span>
                              </div>
                            ) : activeSquad.length > 0 ? (
                              <select
                                value={confirmedMOTM}
                                onChange={(e) => setConfirmedMOTM(e.target.value)}
                                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-sans"
                              >
                                <option value="">-- Select Man of the Match --</option>
                                {activeSquad.map(player => (
                                  <option key={`${player.team}_${player.name}`} value={player.name}>
                                    {player.name} ({player.team} - {player.position})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  value={confirmedMOTM}
                                  onChange={(e) => setConfirmedMOTM(e.target.value)}
                                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-sans"
                                >
                                  <option value="">-- Select Default Players (API squad empty) --</option>
                                  <option value="Kylian Mbappé">Kylian Mbappé (FRA)</option>
                                  <option value="Antoine Griezmann">Antoine Griezmann (FRA)</option>
                                  <option value="Olivier Giroud">Olivier Giroud (FRA)</option>
                                  <option value="Harry Kane">Harry Kane (ENG)</option>
                                  <option value="Jude Bellingham">Jude Bellingham (ENG)</option>
                                  <option value="Lionel Messi">Lionel Messi (ARG)</option>
                                  <option value="Vinicius Jr.">Vinicius Jr. (BRA)</option>
                                  <option value="Luka Modrić">Luka Modrić (CRO)</option>
                                </select>
                                <input
                                  type="text"
                                  value={confirmedMOTM}
                                  onChange={(e) => setConfirmedMOTM(e.target.value)}
                                  placeholder="Or enter MOTM full name manually"
                                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518] font-sans mt-2"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Penalty Shootout Score input */}
                        {confirmedHomeGoals !== '' && 
                        confirmedAwayGoals !== '' && 
                        parseInt(confirmedHomeGoals) === parseInt(confirmedAwayGoals) && 
                        [
                          'Round of 32',
                          'Round of 16',
                          'Quarter-finals',
                          'Semi-finals',
                          'Play-off for third place',
                          'Final'
                        ].includes(match.stage) && (
                          <div className="mt-4 border-t border-white/5 pt-4">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                              ⚽ Penalty Shootout Score (Knockout Draw)
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 flex items-center justify-end gap-2">
                                <span className="text-xs text-gray-400">{match.homeTeam.code}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={confirmedHomePenalties}
                                  onChange={(e) => setConfirmedHomePenalties(e.target.value)}
                                  placeholder="0"
                                  className="w-12 bg-[#0A0E1A] border border-[#F5C518]/25 rounded-xl p-2 text-center font-mono font-bold text-sm text-[#F5C518] focus:outline-none focus:border-[#F5C518]"
                                />
                              </div>
                              <span className="text-gray-650 font-bold text-xs">-</span>
                              <div className="flex-1 flex items-center justify-start gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={confirmedAwayPenalties}
                                  onChange={(e) => setConfirmedAwayPenalties(e.target.value)}
                                  placeholder="0"
                                  className="w-12 bg-[#0A0E1A] border border-[#F5C518]/25 rounded-xl p-2 text-center font-mono font-bold text-sm text-[#F5C518] focus:outline-none focus:border-[#F5C518]"
                                />
                                <span className="text-xs text-gray-400">:{match.awayTeam.code}</span>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                    {confirmingMatchId === match.id && adminError && (
                      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs mb-4">
                        ⚠️ {adminError}
                      </div>
                    )}

                    {/* Confirmation and Submit Actions */}
                    <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
                      {confirmingMatchId === match.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmingMatchId(null)}
                            className="bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer border-none"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={confirmAwardPointsAction}
                            disabled={isSubmitting}
                            className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer disabled:opacity-50"
                          >
                            {isSubmitting ? 'Resolving...' : 'Resolve & Award Points'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(match)}
                          className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition border-none cursor-pointer"
                        >
                          Resolve Match Results
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Create Fixture Tab */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827]/40 border border-white/5 p-4 rounded-xl">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Database Operations</h3>
              <p className="text-[10px] text-gray-400 mt-1">Reset match fixtures to default mock matches with updated kickoff dates.</p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleGenerateSampleFixture}
                disabled={isSubmitting}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-2 px-4 rounded-xl text-xs transition duration-300 cursor-pointer disabled:opacity-50"
              >
                ⚡ Generate Sample Fixture
              </button>
              <button
                type="button"
                onClick={handleForceReseed}
                disabled={isSubmitting}
                className="bg-[#F5C518]/10 hover:bg-[#F5C518] text-[#F5C518] hover:text-black border border-[#F5C518]/25 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-300 cursor-pointer disabled:opacity-50"
              >
                🔄 Re-seed Database Matches
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateFixture} className="card space-y-6">
            <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Create Tournament Fixture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Home Team Details */}
            <div className="space-y-4 bg-black/15 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-[#F5C518] uppercase tracking-wider font-mono">Home Team</span>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Team Name</label>
                <select
                  value={newHomeName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewHomeName(name);
                    if (countryCodes[name]) setNewHomeCode(countryCodes[name]);
                    if (twoLetterCodes[name]) setNewHomeCrest(`https://flagcdn.com/w160/${twoLetterCodes[name]}.png`);
                  }}
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="">-- Select Home Team --</option>
                  {sortedTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">TLA Code (3 Letters)</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={newHomeCode}
                    onChange={(e) => setNewHomeCode(e.target.value.toUpperCase())}
                    placeholder="ESP"
                    className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518] text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Crest URL (Optional)</label>
                  <input
                    type="url"
                    value={newHomeCrest}
                    onChange={(e) => setNewHomeCrest(e.target.value)}
                    placeholder="https://crests..."
                    className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518]"
                  />
                </div>
              </div>
            </div>

            {/* Away Team Details */}
            <div className="space-y-4 bg-black/15 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-[#F5C518] uppercase tracking-wider font-mono">Away Team</span>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Team Name</label>
                <select
                  value={newAwayName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewAwayName(name);
                    if (countryCodes[name]) setNewAwayCode(countryCodes[name]);
                    if (twoLetterCodes[name]) setNewAwayCrest(`https://flagcdn.com/w160/${twoLetterCodes[name]}.png`);
                  }}
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="">-- Select Away Team --</option>
                  {sortedTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">TLA Code (3 Letters)</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={newAwayCode}
                    onChange={(e) => setNewAwayCode(e.target.value.toUpperCase())}
                    placeholder="GER"
                    className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518] text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Crest URL (Optional)</label>
                  <input
                    type="url"
                    value={newAwayCrest}
                    onChange={(e) => setNewAwayCrest(e.target.value)}
                    placeholder="https://crests..."
                    className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* General Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Kickoff Time (IST)</label>
              <input
                type="datetime-local"
                required
                value={newKickoff}
                onChange={(e) => setNewKickoff(e.target.value)}
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Venue</label>
              <input
                type="text"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                placeholder="e.g. SoFi Stadium"
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tournament Stage</label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
              >
                <option value="GROUP_STAGE">Group Stage</option>
                <option value="ROUND_OF_16">Round of 16</option>
                <option value="QUARTER_FINALS">Quarter Finals</option>
                <option value="SEMI_FINALS">Semi Finals</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
          </div>



          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer"
            >
              {isSubmitting ? 'Creating fixture...' : 'Create Fixture'}
            </button>
          </div>
          </form>
        </div>
      )}

      {/* 3. Users & Predictions Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="card !p-0 overflow-hidden">
            <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">User Index</span>
              <span className="text-[10px] bg-[#F5C518]/10 text-[#F5C518] px-2 py-0.5 rounded font-bold border border-[#F5C518]/25">{players.length} Total</span>
            </div>
            
            <div className="divide-y divide-white/5">
              {players.map((player) => (
                <div key={player.id} className="block transition">
                  <div 
                    onClick={() => handleFetchUserPredictions(player.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-white/5 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {player.photoURL ? (
                        <img src={player.photoURL} alt={player.name} className="w-8 h-8 rounded-full border border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300 text-xs">
                          {player.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <span className="text-white font-bold text-sm block leading-tight">{player.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{player.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 sm:mt-0 justify-between sm:justify-end">
                      <span className="text-[10px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        {player.isAdmin ? 'Admin' : 'Player'}
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block font-semibold">STANDINGS POINTS</span>
                        <span className="text-sm font-black text-[#F5C518] font-mono leading-none">
                          {player.totalPoints || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Predictions Area */}
                  {selectedUser === player.id && (
                    <div className="bg-black/25 border-t border-white/5 p-6 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2 border-b border-white/5 pb-2">
                        <Users className="w-4 h-4 text-[#F5C518]" />
                        <span>PREDICTIONS AUDIT</span>
                      </h4>

                      {loadingUserPreds ? (
                        <div className="flex items-center gap-2 py-4 justify-center text-xs text-gray-400 font-medium">
                          <div className="w-4 h-4 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
                          <span>Fetching user picks...</span>
                        </div>
                      ) : userPredictions.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">This user has not submitted any predictions yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userPredictions.map((pred) => {
                            const match = getMatchDetails(pred.matchId);
                            if (!match) return null;

                            return (
                              <div key={pred.id} className="bg-[#111827] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2.5">
                                  <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                                    {match.stage?.replace('_', ' ')}
                                  </span>
                                  {pred.pointsEarned !== null && pred.pointsEarned !== undefined ? (
                                    <span className="text-[10px] font-mono font-bold text-[#F5C518] bg-[#F5C518]/10 border border-[#F5C518]/25 px-2 py-0.5 rounded">
                                      +{pred.pointsEarned} PTS
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-gray-500 uppercase font-mono">PENDING RESOLUTION</span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between py-1 select-none">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white uppercase">{match.homeTeam?.code}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">Pick:</span>
                                    <span className="font-mono text-sm font-black text-[#F5C518] bg-[#0A0E1A] border border-[#F5C518]/20 px-2 py-0.5 rounded">
                                      {pred.homeGoals} - {pred.awayGoals}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white uppercase">{match.awayTeam?.code}</span>
                                  </div>
                                </div>

                                <div className="border-t border-white/5 mt-2.5 pt-2 text-[10px] font-medium text-gray-400">
                                  <div>
                                    <span className="text-gray-500 uppercase text-[8px] font-bold block mb-0.5 font-mono">MOTM PICK</span>
                                    <span className="text-white truncate block">{pred.manOfTheMatch || 'None'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Fixture List Tab */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="card text-center py-16 border border-white/5 bg-[#111827]/40 rounded-2xl">
              <Calendar className="w-12 h-12 text-[#F5C518]/25 mx-auto mb-4" />
              <h4 className="text-base font-bold text-white uppercase tracking-wider mb-2 font-display">No Scheduled Fixtures</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6 font-sans">
                You have not added any match fixtures yet. Use the Create Fixture tab to add the first match.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-[#F5C518] hover:bg-amber-400 text-black font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer font-sans"
              >
                Create First Fixture
              </button>
            </div>
          ) : (
            <div className="card !p-0 overflow-hidden">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Tournaments Fixture List</span>
                  <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-bold border border-white/10">{matches.length} matches</span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={fixtureSearch}
                    onChange={(e) => setFixtureSearch(e.target.value)}
                    placeholder="Search team, venue, stage..."
                    className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518] transition font-sans"
                  />
                  {fixtureSearch && (
                    <button
                      onClick={() => setFixtureSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer p-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-black/10 border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider font-mono select-none">
                      <th className="px-6 py-4">Matchup</th>
                      <th className="px-6 py-4">Stage & Venue</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {matches.filter((match) => {
                      if (!fixtureSearch.trim()) return true;
                      const q = fixtureSearch.toLowerCase().trim();
                      return (
                        (match.homeTeam?.name || '').toLowerCase().includes(q) ||
                        (match.homeTeam?.code || '').toLowerCase().includes(q) ||
                        (match.awayTeam?.name || '').toLowerCase().includes(q) ||
                        (match.awayTeam?.code || '').toLowerCase().includes(q) ||
                        (match.venue || '').toLowerCase().includes(q) ||
                        (match.stage || '').toLowerCase().replace('_', ' ').includes(q) ||
                        (match.status || '').toLowerCase().includes(q) ||
                        (match.matchId || '').toLowerCase().includes(q)
                      );
                    }).map((match) => (
                      <tr key={match.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 font-bold text-white text-xs select-none">
                            <span className="bg-[#1C2333] border border-white/5 rounded px-1.5 py-0.5 text-gray-300">{match.homeTeam?.code}</span>
                            <span className="text-gray-500 font-normal">vs</span>
                            <span className="bg-[#1C2333] border border-white/5 rounded px-1.5 py-0.5 text-gray-300">{match.awayTeam?.code}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 block mt-1 font-mono font-semibold">ID: {match.matchId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white text-xs font-bold block">{match.stage?.replace('_', ' ')}</span>
                          <span className="text-[10px] text-gray-500 block font-medium mt-0.5">{match.venue}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-extrabold uppercase border px-2 py-0.5 rounded tracking-wide ${
                            match.confirmed
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : match.status === 'IN_PLAY' || match.status === 'PAUSED'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-white/5 text-gray-400 border-white/10'
                          }`}>
                            {match.status} {match.confirmed && '(RESOLVED)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <div className="flex items-center justify-end space-x-3 select-none">
                            <button
                              onClick={() => handleOpenEdit(match)}
                              disabled={match.confirmed}
                              className="text-[#F5C518] hover:text-amber-400 text-xs font-extrabold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-none bg-transparent flex items-center gap-1 font-sans transition-all duration-300 transform hover:scale-110 active:scale-95 hover:bg-[#F5C518]/10 px-2.5 py-1.5 rounded-lg"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteFixture(match.id)}
                              className="text-red-400 hover:text-red-500 text-xs font-extrabold cursor-pointer border-none bg-transparent flex items-center gap-1 font-sans transition-all duration-300 transform hover:scale-110 active:scale-95 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EDIT FIXTURE CARD (SCROLL TARGET) */}
          {editingMatchId && (
            <div ref={editFormRef} className="card max-w-2xl w-full mx-auto border border-[#F5C518]/25 bg-[#0F1520] rounded-2xl shadow-2xl relative p-6 mt-6">
              <button 
                onClick={() => setEditingMatchId(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-6">
                Edit Tournament Fixture
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Home Team Details */}
                  <div className="space-y-4 bg-black/15 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-[#F5C518] uppercase tracking-wider font-mono">Home Team</span>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Team Name</label>
                      <select
                        value={editHomeName}
                        onChange={(e) => {
                          const name = e.target.value;
                          setEditHomeName(name);
                          if (countryCodes[name]) setEditHomeCode(countryCodes[name]);
                          if (twoLetterCodes[name]) setEditHomeCrest(`https://flagcdn.com/w160/${twoLetterCodes[name]}.png`);
                        }}
                        className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                      >
                        <option value="">-- Select Home Team --</option>
                        {sortedTeams.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">TLA Code</label>
                        <input
                          type="text"
                          required
                          maxLength={3}
                          value={editHomeCode}
                          onChange={(e) => setEditHomeCode(e.target.value.toUpperCase())}
                          placeholder="ESP"
                          className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-[#F5C518]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Crest URL</label>
                        <input
                          type="url"
                          value={editHomeCrest}
                          onChange={(e) => setEditHomeCrest(e.target.value)}
                          placeholder="https://crests..."
                          className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Away Team Details */}
                  <div className="space-y-4 bg-black/15 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-[#F5C518] uppercase tracking-wider font-mono">Away Team</span>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Team Name</label>
                      <select
                        value={editAwayName}
                        onChange={(e) => {
                          const name = e.target.value;
                          setEditAwayName(name);
                          if (countryCodes[name]) setEditAwayCode(countryCodes[name]);
                          if (twoLetterCodes[name]) setEditAwayCrest(`https://flagcdn.com/w160/${twoLetterCodes[name]}.png`);
                        }}
                        className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                      >
                        <option value="">-- Select Away Team --</option>
                        {sortedTeams.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">TLA Code</label>
                        <input
                          type="text"
                          required
                          maxLength={3}
                          value={editAwayCode}
                          onChange={(e) => setEditAwayCode(e.target.value.toUpperCase())}
                          placeholder="GER"
                          className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-[#F5C518]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Crest URL</label>
                        <input
                          type="url"
                          value={editAwayCrest}
                          onChange={(e) => setEditAwayCrest(e.target.value)}
                          placeholder="https://crests..."
                          className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* General Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Kickoff (IST)</label>
                    <input
                      type="datetime-local"
                      required
                      value={editKickoff}
                      onChange={(e) => setEditKickoff(e.target.value)}
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Venue</label>
                    <input
                      type="text"
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      placeholder="e.g. SoFi Stadium"
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Stage</label>
                    <select
                      value={editStage}
                      onChange={(e) => setEditStage(e.target.value)}
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                    >
                      <option value="GROUP_STAGE">Group Stage</option>
                      <option value="ROUND_OF_16">Round of 16</option>
                      <option value="QUARTER_FINALS">Quarter Finals</option>
                      <option value="SEMI_FINALS">Semi Finals</option>
                      <option value="FINAL">Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="IN_PLAY">IN_PLAY</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="FINISHED">FINISHED</option>
                    </select>
                  </div>
                </div>

                {/* Live Score Fields */}
                <div className="grid grid-cols-2 gap-4 bg-black/15 p-4 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Live Score (Home Team)</label>
                    <input
                      type="number"
                      min="0"
                      value={editHomeGoals}
                      onChange={(e) => setEditHomeGoals(e.target.value)}
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Live Score (Away Team)</label>
                    <input
                      type="number"
                      min="0"
                      value={editAwayGoals}
                      onChange={(e) => setEditAwayGoals(e.target.value)}
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-mono text-center"
                    />
                  </div>
                </div>



                <div className="flex justify-end space-x-3 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingMatchId(null)}
                    className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer border-none bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveMatchEdit(editingMatchId)}
                    disabled={isSubmitting}
                    className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-extrabold py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Dream Team Rankings Tab */}
      {activeTab === 'dreamteam' && (
        <div className="space-y-4">
          <DreamTeamRankingsPanel adminEmail={user?.email} />
        </div>
      )}

      {/* 6. Manage Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="text-left">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Player Roster Management
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 font-sans">
                  Add new players or edit details like position, price, and jersey number globally.
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleClearPlayerImages}
                  disabled={isSubmitting}
                  className="bg-[#F5C518]/10 hover:bg-[#F5C518] text-[#F5C518] hover:text-black border border-[#F5C518]/25 font-bold py-2 px-4 rounded-xl text-xs transition duration-300 cursor-pointer disabled:opacity-50"
                >
                  🗑️ Clear Picture URLs from Firebase
                </button>
                {selectedPlayerTeam && (
                  <button
                    type="button"
                    onClick={handleAddNewPlayerClick}
                    className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer"
                  >
                    + Add New Player
                  </button>
                )}
              </div>
            </div>

            {adminError && (
              <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-xl text-red-400 text-xs">
                ⚠️ {adminError}
              </div>
            )}

            <div className="space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                  Select Team / Country
                </label>
                <select
                  value={selectedPlayerTeam}
                  onChange={(e) => {
                    setSelectedPlayerTeam(e.target.value);
                    setEditingPlayer(null);
                    setIsAddingNewPlayer(false);
                  }}
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="">-- Choose a Team --</option>
                  {sortedTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {selectedPlayerTeam && !editingPlayer && !isAddingNewPlayer && (
                <div className="border border-white/5 bg-black/20 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 select-none">
                    <span className="text-xs font-bold text-[#F5C518] uppercase tracking-wider font-mono">
                      {selectedPlayerTeam} Squad list
                    </span>
                    <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold font-mono">
                      {(squadData[selectedPlayerTeam] || []).length} Players
                    </span>
                  </div>

                  {(squadData[selectedPlayerTeam] || []).length === 0 ? (
                    <p className="text-gray-500 text-xs italic py-4 text-center">No players registered. Click Add New Player to start.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {squadData[selectedPlayerTeam].map((player, idx) => (
                        <div
                          key={`${player.name}_${idx}`}
                          className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between transition-all hover:border-white/10"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                              {player.pictureUrl ? (
                                <img src={player.pictureUrl} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-gray-400">
                                  {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="truncate text-left">
                              <span className="text-white font-bold text-xs block leading-tight truncate">
                                {player.name}
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-1 font-mono">
                                #{player.number || '—'} • {player.position || 'Player'} • ${player.price || '5.0'}M
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditPlayerClick(player)}
                            className="text-[#F5C518] hover:text-amber-400 text-xs font-extrabold cursor-pointer border-none bg-transparent hover:bg-[#F5C518]/10 px-2.5 py-1.5 rounded-lg transition"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add / Edit Form */}
              {(editingPlayer || isAddingNewPlayer) && (
                <form onSubmit={handleSavePlayer} className="border border-[#F5C518]/25 bg-[#0F1520]/80 rounded-xl p-5 space-y-4 text-left">
                  <h4 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider font-mono border-b border-white/5 pb-2">
                    {isAddingNewPlayer ? `Add Player to ${selectedPlayerTeam}` : `Edit Player: ${editingPlayer.name}`}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Player Name</label>
                      <input
                        type="text"
                        required
                        value={formPlayerName}
                        onChange={(e) => setFormPlayerName(e.target.value)}
                        placeholder="e.g. Lionel Messi"
                        className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Jersey Number</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        value={formPlayerNumber}
                        onChange={(e) => setFormPlayerNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="10"
                        className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518] text-center font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Position</label>
                      <select
                        value={formPlayerPosition}
                        onChange={(e) => setFormPlayerPosition(e.target.value)}
                        className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
                      >
                        <option value="GK">Goalkeeper (GK)</option>
                        <option value="DF">Defender (DF)</option>
                        <option value="MF">Midfielder (MF)</option>
                        <option value="FW">Forward (FW)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Dream Team Price ($M)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="3.0"
                        max="20.0"
                        required
                        value={formPlayerPrice}
                        onChange={(e) => setFormPlayerPrice(e.target.value)}
                        placeholder="5.0"
                        className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5C518] font-mono text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2 border-t border-white/5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlayer(null);
                        setIsAddingNewPlayer(false);
                      }}
                      className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer border-none bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer"
                    >
                      {isSubmitting ? 'Saving player...' : 'Save Player'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
