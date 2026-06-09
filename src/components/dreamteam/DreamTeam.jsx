// src/components/dreamteam/DreamTeam.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { squadData } from '../../utils/tournamentData';
import { calculateDreamTeamPoints } from '../../utils/dreamTeamCalc';
import { 
  Award, 
  Search, 
  Lock, 
  HelpCircle, 
  Check, 
  X, 
  Info, 
  User, 
  Save, 
  Sparkles,
  Calendar,
  AlertTriangle,
  Flag,
  ArrowLeftRight,
  TrendingUp,
  RefreshCw,
  Star
} from 'lucide-react';

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

const countryKits = {
  'Algeria': { primary: '#ffffff', secondary: '#15803d', shorts: '#ffffff', style: 'plain' },
  'Argentina': { primary: '#38bdf8', secondary: '#ffffff', shorts: '#000000', style: 'stripes' },
  'Australia': { primary: '#eab308', secondary: '#15803d', shorts: '#15803d', style: 'plain' },
  'Austria': { primary: '#dc2626', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'Belgium': { primary: '#851010', secondary: '#000000', shorts: '#000000', style: 'plain' },
  'Bosnia And Herzegovina': { primary: '#1d4ed8', secondary: '#facc15', shorts: '#1d4ed8', style: 'plain' },
  'Brazil': { primary: '#fbbf24', secondary: '#15803d', shorts: '#1d4ed8', style: 'plain' },
  'Canada': { primary: '#dc2626', secondary: '#ffffff', shorts: '#dc2626', style: 'plain' },
  'Cape Verde': { primary: '#1e3a8a', secondary: '#ffffff', shorts: '#1e3a8a', style: 'plain' },
  'Colombia': { primary: '#fbbf24', secondary: '#1d4ed8', shorts: '#ffffff', style: 'plain' },
  'Congo DR': { primary: '#3b82f6', secondary: '#ef4444', shorts: '#ef4444', style: 'plain' },
  'Croatia': { primary: '#dc2626', secondary: '#ffffff', shorts: '#ffffff', style: 'checkers' },
  'Curacao': { primary: '#1e40af', secondary: '#facc15', shorts: '#1e40af', style: 'plain' },
  'Czech Republic': { primary: '#dc2626', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'Ecuador': { primary: '#fbbf24', secondary: '#1e40af', shorts: '#1e40af', style: 'plain' },
  'Egypt': { primary: '#b91c1c', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'England': { primary: '#ffffff', secondary: '#1e3a8a', shorts: '#1e3a8a', style: 'plain' },
  'France': { primary: '#1e3a8a', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'Germany': { primary: '#ffffff', secondary: '#000000', shorts: '#000000', style: 'plain' },
  'Ghana': { primary: '#ffffff', secondary: '#dc2626', shorts: '#ffffff', style: 'plain' },
  'Haiti': { primary: '#1e40af', secondary: '#dc2626', shorts: '#1e40af', style: 'plain' },
  'Iran': { primary: '#ffffff', secondary: '#16a34a', shorts: '#ffffff', style: 'plain' },
  'Iraq': { primary: '#15803d', secondary: '#ffffff', shorts: '#15803d', style: 'plain' },
  'Ivory Coast': { primary: '#f97316', secondary: '#ffffff', shorts: '#f97316', style: 'plain' },
  'Japan': { primary: '#1e40af', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'Jordan': { primary: '#ffffff', secondary: '#dc2626', shorts: '#dc2626', style: 'plain' },
  'South Korea': { primary: '#ef4444', secondary: '#1e3a8a', shorts: '#ef4444', style: 'plain' },
  'Mexico': { primary: '#15803d', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'Morocco': { primary: '#c2410c', secondary: '#15803d', shorts: '#15803d', style: 'plain' },
  'Netherlands': { primary: '#f97316', secondary: '#ffffff', shorts: '#f97316', style: 'plain' },
  'New Zealand': { primary: '#ffffff', secondary: '#000000', shorts: '#ffffff', style: 'plain' },
  'Norway': { primary: '#ef4444', secondary: '#1e3a8a', shorts: '#1e3a8a', style: 'plain' },
  'Panama': { primary: '#dc2626', secondary: '#1e3a8a', shorts: '#dc2626', style: 'plain' },
  'Paraguay': { primary: '#dc2626', secondary: '#ffffff', shorts: '#1e40af', style: 'stripes' },
  'Portugal': { primary: '#b91c1c', secondary: '#15803d', shorts: '#15803d', style: 'plain' },
  'Qatar': { primary: '#800020', secondary: '#ffffff', shorts: '#800020', style: 'plain' },
  'Saudi Arabia': { primary: '#ffffff', secondary: '#15803d', shorts: '#15803d', style: 'plain' },
  'Scotland': { primary: '#1e3a8a', secondary: '#ffffff', shorts: '#1e3a8a', style: 'plain' },
  'Senegal': { primary: '#ffffff', secondary: '#15803d', shorts: '#ffffff', style: 'plain' },
  'South Africa': { primary: '#fbbf24', secondary: '#15803d', shorts: '#15803d', style: 'plain' },
  'Spain': { primary: '#dc2626', secondary: '#fbbf24', shorts: '#1e40af', style: 'plain' },
  'Sweden': { primary: '#fbbf24', secondary: '#1e40af', shorts: '#1e40af', style: 'plain' },
  'Switzerland': { primary: '#dc2626', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'Tunisia': { primary: '#ffffff', secondary: '#dc2626', shorts: '#ffffff', style: 'plain' },
  'Turkey': { primary: '#dc2626', secondary: '#ffffff', shorts: '#ffffff', style: 'plain' },
  'USA': { primary: '#ffffff', secondary: '#1e3a8a', shorts: '#1e3a8a', style: 'plain' },
  'Uruguay': { primary: '#38bdf8', secondary: '#000000', shorts: '#000000', style: 'plain' },
  'Uzbekistan': { primary: '#ffffff', secondary: '#3b82f6', shorts: '#ffffff', style: 'plain' }
};

const Jersey2D = ({ team, number = '10', isFilled, isLocked, sizeClass = "w-13 h-13 sm:w-15 sm:h-15" }) => {
  const kit = countryKits[team] || { primary: '#3b82f6', secondary: '#ffffff', style: 'plain' };

  if (!isFilled) {
    return (
      <svg viewBox="0 0 100 100" className={`${sizeClass} drop-shadow-md text-gray-500 hover:text-gray-400 transition-all select-none`}>
        <path 
          d="M 38 10 C 42 16, 58 16, 62 10 L 78 18 L 88 35 L 75 42 L 70 30 L 72 85 L 28 85 L 30 30 L 25 42 L 12 35 L 22 18 Z" 
          fill="rgba(255,255,255,0.06)" 
          stroke="rgba(255,255,255,0.15)" 
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        <text x="50" y="52" fontSize="26" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fill="rgba(255,255,255,0.2)">+</text>
      </svg>
    );
  }

  let numberColor = kit.secondary;
  if (kit.primary.toLowerCase() === kit.secondary.toLowerCase()) {
    numberColor = kit.primary.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff';
  } else if (kit.primary.toLowerCase() === '#38bdf8' && kit.secondary.toLowerCase() === '#ffffff') {
    numberColor = '#1e3a8a';
  }

  const clipId = `jersey-clip-${(team || '').replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <svg viewBox="0 0 100 100" className={`${sizeClass} drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)] hover:scale-105 transition duration-300 select-none`}>
      <defs>
        <clipPath id={clipId}>
          <path d="M 38 10 C 42 16, 58 16, 62 10 L 78 18 L 88 35 L 75 42 L 70 30 L 72 85 L 28 85 L 30 30 L 25 42 L 12 35 L 22 18 Z" />
        </clipPath>
        
        <linearGradient id="jersey-shading-2d" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.25" />
          <stop offset="15%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="100" fill={kit.primary} />

        {kit.style === 'stripes' && (
          <g fill={kit.secondary}>
            <rect x="16" y="0" width="8" height="100" />
            <rect x="32" y="0" width="8" height="100" />
            <rect x="48" y="0" width="8" height="100" />
            <rect x="64" y="0" width="8" height="100" />
            <rect x="80" y="0" width="8" height="100" />
          </g>
        )}
        {kit.style === 'checkers' && (
          <g fill={kit.secondary}>
            {Array.from({ length: 6 }).map((_, x) =>
              Array.from({ length: 6 }).map((_, y) => 
                (x + y) % 2 === 0 ? <rect key={`${x}-${y}`} x={x * 16.7} y={y * 16.7} width={16.7} height={16.7} /> : null
              )
            )}
          </g>
        )}
        {kit.style === 'hoops' && (
          <g fill={kit.secondary}>
            <rect x="0" y="20" width="100" height="10" />
            <rect x="0" y="40" width="100" height="10" />
            <rect x="0" y="60" width="100" height="10" />
            <rect x="0" y="80" width="100" height="10" />
          </g>
        )}
        {kit.style === 'sash' && (
          <polygon points="0,15 25,0 100,75 100,90 75,100 0,25" fill={kit.secondary} />
        )}

        <polygon points="38,10 62,10 50,22" fill={kit.secondary} />
        <rect x="0" y="0" width="100" height="100" fill="url(#jersey-shading-2d)" />

        {countryFlags[team] && (
          <text x="34" y="31" fontSize="10" textAnchor="middle">{countryFlags[team]}</text>
        )}

        <text 
          x="50" 
          y="62" 
          fontSize="22" 
          fontWeight="900" 
          fontFamily="monospace" 
          textAnchor="middle" 
          fill={numberColor}
        >
          {number}
        </text>
      </g>

      <path 
        d="M 38 10 C 42 16, 58 16, 62 10 L 78 18 L 88 35 L 75 42 L 70 30 L 72 85 L 28 85 L 30 30 L 25 42 L 12 35 L 22 18 Z" 
        fill="none" 
        stroke="rgba(255,255,255,0.2)" 
        strokeWidth="1.5" 
      />
    </svg>
  );
};

const FORMATION_CONFIGS = {
  '4-4-2': { DF: 4, MF: 4, FW: 2 },
  '4-3-3': { DF: 4, MF: 3, FW: 3 },
  '3-5-2': { DF: 3, MF: 5, FW: 2 },
  '5-3-2': { DF: 5, MF: 3, FW: 2 },
  '3-4-3': { DF: 3, MF: 4, FW: 3 }
};

const getDFLeft = (index, total) => {
  if (total === 3) return [25, 50, 75][index];
  if (total === 4) return [15, 38, 62, 85][index];
  if (total === 5) return [10, 30, 50, 70, 90][index];
  return 50;
};

const getMFLeft = (index, total) => {
  if (total === 3) return [25, 50, 75][index];
  if (total === 4) return [15, 38, 62, 85][index];
  if (total === 5) return [10, 30, 50, 70, 90][index];
  return 50;
};

const getFWLeft = (index, total) => {
  if (total === 1) return [50][index];
  if (total === 2) return [33, 67][index];
  if (total === 3) return [20, 50, 80][index];
  return 50;
};

export default function DreamTeam() {
  const { user } = useAuth();
  const [squad, setSquad] = useState({}); // { slotId: playerObj } where slotId is GK1-2, DF1-5, MF1-5, FW1-3
  const [formation, setFormation] = useState('4-4-2');
  const [captainSlot, setCaptainSlot] = useState(null);
  const [viewMode, setViewMode] = useState('2D');
  
  const [kickoffTime, setKickoffTime] = useState(new Date('2026-06-11T19:00:00Z'));
  const [isLocked, setIsLocked] = useState(false);
  const [rankings, setRankings] = useState(null); // admin rankings
  const [userPointsBreakdown, setUserPointsBreakdown] = useState(null); // calculated player breakdown
  const [userTotalPoints, setUserTotalPoints] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Selector modal state
  const [activeSlot, setActiveSlot] = useState(null); // slot config object { id, label, position }
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sortByPrice, setSortByPrice] = useState('desc'); // 'desc', 'asc', 'none'

  // Action drawer/modal for selected player
  const [selectedPlayerSlot, setSelectedPlayerSlot] = useState(null);
  
  // How to play modal state
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);

  // Countdown timer state
  const [countdownText, setCountdownText] = useState('');

  // Check starter status of a slot based on active formation
  const isSlotStarting = (slotId, form) => {
    const config = FORMATION_CONFIGS[form];
    const pos = slotId.replace(/[0-9]/g, '');
    const index = parseInt(slotId.replace(/[^0-9]/g, ''), 10);
    
    if (pos === 'GK') return index === 1;
    if (pos === 'DF') return index <= config.DF;
    if (pos === 'MF') return index <= config.MF;
    if (pos === 'FW') return index <= config.FW;
    return false;
  };

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Kickoff Time of earliest match
        if (db) {
          const matchesRef = collection(db, 'matches');
          const q = query(matchesRef, orderBy('kickoffTime', 'asc'), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const firstMatch = snap.docs[0].data();
            if (firstMatch.kickoffTime) {
              const date = firstMatch.kickoffTime.toDate ? firstMatch.kickoffTime.toDate() : new Date(firstMatch.kickoffTime);
              setKickoffTime(date);
            }
          }
        }

        // 2. Fetch User's Dream Team
        let existingSquad = {};
        let capSlot = null;
        let savedFormation = '4-4-2';

        if (user.isMock || !db) {
          const localData = localStorage.getItem(`mock_dream_team_${user.uid}`);
          if (localData) {
            const data = JSON.parse(localData);
            if (data.formation) {
              savedFormation = data.formation;
            }
            if (data.players) {
              data.players.forEach(p => {
                let slot = p.slot;
                if (slot === 'GK') slot = 'GK1';
                
                const countryPlayers = squadData[p.team] || [];
                const found = countryPlayers.find(cp => cp.name.toLowerCase() === p.name.toLowerCase());

                existingSquad[slot] = {
                  name: found ? found.name : p.name,
                  team: p.team,
                  position: found ? found.position : p.position,
                  price: found ? found.price : (p.price || 5.0),
                  number: found ? found.number : (p.number || '10')
                };
                if (p.isCaptain) {
                  capSlot = slot;
                }
              });
            }
          }
        } else {
          const dtRef = doc(db, 'dream_teams', user.uid);
          const dtSnap = await getDoc(dtRef);
          if (dtSnap.exists()) {
            const data = dtSnap.data();
            if (data.formation) {
              savedFormation = data.formation;
            }
            if (data.players) {
              data.players.forEach(p => {
                let slot = p.slot;
                if (slot === 'GK') slot = 'GK1';
                
                const countryPlayers = squadData[p.team] || [];
                const found = countryPlayers.find(cp => cp.name.toLowerCase() === p.name.toLowerCase());

                existingSquad[slot] = {
                  name: found ? found.name : p.name,
                  team: p.team,
                  position: found ? found.position : p.position,
                  price: found ? found.price : (p.price || 5.0),
                  number: found ? found.number : (p.number || '10')
                };
                if (p.isCaptain) {
                  capSlot = slot;
                }
              });
            }
          }
        }
        setFormation(savedFormation);
        setSquad(existingSquad);
        setCaptainSlot(capSlot);

        // 3. Fetch Admin published Rankings
        if (db) {
          const rankingsRef = doc(db, 'system', 'dream_team_rankings');
          const rankingsSnap = await getDoc(rankingsRef);
          if (rankingsSnap.exists()) {
            const data = rankingsSnap.data();
            setRankings(data.rankings);
          }
        }
      } catch (err) {
        console.error("Failed to load Dream Team data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Lock status & countdown updater
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = kickoffTime - now;

      if (diff <= 0) {
        setIsLocked(true);
        setCountdownText("LOCKED");
      } else {
        setIsLocked(false);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdownText(`${days} day${days > 1 ? 's' : ''} left`);
        } else {
          setCountdownText(`${hours}h ${minutes}m ${seconds}s remaining`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [kickoffTime]);

  // Calculate points whenever rankings, squad, formation, or captainSlot changes
  useEffect(() => {
    if (rankings && Object.keys(squad).length === 15) {
      const squadArr = Object.entries(squad).map(([slot, player]) => ({
        ...player,
        slot,
        isStarting: isSlotStarting(slot, formation),
        isCaptain: slot === captainSlot
      }));
      const { total, playerPoints } = calculateDreamTeamPoints(squadArr, rankings);
      setUserTotalPoints(total);
      
      const breakdownObj = {};
      playerPoints.forEach(p => {
        breakdownObj[p.name] = {
          points: p.points,
          basePoints: p.basePoints,
          rank: p.rank
        };
      });
      setUserPointsBreakdown(breakdownObj);
    }
  }, [rankings, squad, formation, captainSlot]);

  // Handle captain migration if benched or formation changed
  useEffect(() => {
    if (captainSlot && !isSlotStarting(captainSlot, formation)) {
      // Find another starting slot to make captain
      const starterSlots = getStartingSlotsConfig();
      const firstFilledStarter = starterSlots.find(slot => squad[slot.id]);
      if (firstFilledStarter) {
        setCaptainSlot(firstFilledStarter.id);
      } else {
        setCaptainSlot(null);
      }
    }
  }, [formation, squad]);

  // Helpers to get Starting and Bench Slots Config dynamically
  const getStartingSlotsConfig = () => {
    const config = FORMATION_CONFIGS[formation];
    const slots = [];
    slots.push({ 
      id: 'GK1', 
      label: 'GK', 
      position: 'GK', 
      style: { bottom: '6%', left: '50%', transform: 'translateX(-50%)' } 
    });
    
    for (let i = 1; i <= config.DF; i++) {
      const left = getDFLeft(i - 1, config.DF);
      slots.push({ 
        id: `DF${i}`, 
        label: 'DF', 
        position: 'DF', 
        style: { bottom: '28%', left: `${left}%`, transform: 'translateX(-50%)' } 
      });
    }
    for (let i = 1; i <= config.MF; i++) {
      const left = getMFLeft(i - 1, config.MF);
      slots.push({ 
        id: `MF${i}`, 
        label: 'MF', 
        position: 'MF', 
        style: { bottom: '52%', left: `${left}%`, transform: 'translateX(-50%)' } 
      });
    }
    for (let i = 1; i <= config.FW; i++) {
      const left = getFWLeft(i - 1, config.FW);
      slots.push({ 
        id: `FW${i}`, 
        label: 'FW', 
        position: 'FW', 
        style: { bottom: '76%', left: `${left}%`, transform: 'translateX(-50%)' } 
      });
    }
    return slots;
  };

  const getBenchSlotsConfig = () => {
    const config = FORMATION_CONFIGS[formation];
    const slots = [];
    slots.push({ id: 'GK2', label: 'GK', position: 'GK' });
    
    for (let i = config.DF + 1; i <= 5; i++) {
      slots.push({ id: `DF${i}`, label: 'DF', position: 'DF' });
    }
    for (let i = config.MF + 1; i <= 5; i++) {
      slots.push({ id: `MF${i}`, label: 'MF', position: 'MF' });
    }
    for (let i = config.FW + 1; i <= 3; i++) {
      slots.push({ id: `FW${i}`, label: 'FW', position: 'FW' });
    }
    return slots;
  };

  const startingSlots = getStartingSlotsConfig();
  const benchSlots = getBenchSlotsConfig();

  // Compute validation stats
  const filledCount = Object.keys(squad).length;
  
  const getCountryCounts = () => {
    const counts = {};
    Object.values(squad).forEach(p => {
      counts[p.team] = (counts[p.team] || 0) + 1;
    });
    return counts;
  };
  const countryCounts = getCountryCounts();
  const countryWarning = Object.entries(countryCounts).find(([_, count]) => count > 3);

  const totalSquadValue = Object.values(squad).reduce((sum, p) => sum + (p.price || 5.0), 0);
  const budgetRemaining = 100.0 - totalSquadValue;

  // Handle player selection
  const selectPlayer = (player) => {
    if (!activeSlot) return;

    // 1. Check if player is already selected in another slot
    const isAlreadySelected = Object.values(squad).some(
      p => p.name.toLowerCase() === player.name.toLowerCase() && p.team === player.team
    );
    if (isAlreadySelected) {
      alert(`${player.name} is already selected in your squad.`);
      return;
    }

    // 2. Check country limit (max 3)
    const currentCountryCount = countryCounts[player.team] || 0;
    const activeSlotCurrentPlayer = squad[activeSlot.id];
    const isReplacingSameCountry = activeSlotCurrentPlayer && activeSlotCurrentPlayer.team === player.team;
    
    if (currentCountryCount >= 3 && !isReplacingSameCountry) {
      alert(`You can select a maximum of 3 players from ${player.team}.`);
      return;
    }

    // 3. Check budget constraint
    const playerPrice = player.price || 5.0;
    const oldPrice = activeSlotCurrentPlayer ? activeSlotCurrentPlayer.price : 0;
    const netCost = playerPrice - oldPrice;
    if (budgetRemaining - netCost < 0) {
      alert("Insufficient budget! You cannot exceed the $100.0M limit.");
      return;
    }

    // Update squad
    setSquad(prev => ({
      ...prev,
      [activeSlot.id]: {
        name: player.name,
        team: player.team,
        position: player.position,
        price: playerPrice,
        number: player.number || '10'
      }
    }));

    // If starting slot is filled and we have no captain, make them captain
    if (isSlotStarting(activeSlot.id, formation) && !captainSlot) {
      setCaptainSlot(activeSlot.id);
    }

    // Reset drawer state
    setActiveSlot(null);
    setSearchTerm('');
    setSelectedCountry('');
  };

  const removePlayer = (slotId, e) => {
    if (e) e.stopPropagation();
    setSquad(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    if (captainSlot === slotId) {
      setCaptainSlot(null);
    }
  };

  const swapSlots = (slotIdA, slotIdB) => {
    setSquad(prev => {
      const updated = { ...prev };
      const temp = updated[slotIdA];
      updated[slotIdA] = updated[slotIdB];
      updated[slotIdB] = temp;
      
      // Clean up empty keys
      if (!updated[slotIdA]) delete updated[slotIdA];
      if (!updated[slotIdB]) delete updated[slotIdB];
      
      return updated;
    });

    // Swap captain status if one of the slots was captain
    if (captainSlot === slotIdA) {
      setCaptainSlot(slotIdB);
    } else if (captainSlot === slotIdB) {
      setCaptainSlot(slotIdA);
    }
    setSelectedPlayerSlot(null);
  };

  const handleResetSquad = () => {
    if (window.confirm("Are you sure you want to clear your entire squad?")) {
      setSquad({});
      setCaptainSlot(null);
    }
  };

  const autoSelectSquad = () => {
    // Group players by position
    const pools = { GK: [], DF: [], MF: [], FW: [] };
    Object.entries(squadData).forEach(([country, players]) => {
      players.forEach(p => {
        pools[p.position].push({
          name: p.name,
          team: country,
          position: p.position,
          price: p.price || 5.0,
          number: p.number || '10'
        });
      });
    });

    let attempts = 0;
    const maxAttempts = 500;

    while (attempts < maxAttempts) {
      attempts++;
      const selected = {};
      const countryCounts = {};
      let totalPrice = 0;

      let success = true;
      const slots = [
        { id: 'GK1', pos: 'GK' }, { id: 'GK2', pos: 'GK' },
        { id: 'DF1', pos: 'DF' }, { id: 'DF2', pos: 'DF' }, { id: 'DF3', pos: 'DF' }, { id: 'DF4', pos: 'DF' }, { id: 'DF5', pos: 'DF' },
        { id: 'MF1', pos: 'MF' }, { id: 'MF2', pos: 'MF' }, { id: 'MF3', pos: 'MF' }, { id: 'MF4', pos: 'MF' }, { id: 'MF5', pos: 'MF' },
        { id: 'FW1', pos: 'FW' }, { id: 'FW2', pos: 'FW' }, { id: 'FW3', pos: 'FW' }
      ];

      for (const slot of slots) {
        const pool = pools[slot.pos];
        const remainingSlots = slots.length - Object.keys(selected).length - 1;
        const maxAllowedPrice = 100.0 - totalPrice - (remainingSlots * 4.5);

        const candidates = pool.filter(p => {
          const isPicked = Object.values(selected).some(sp => sp.name === p.name && sp.team === p.team);
          const cCount = countryCounts[p.team] || 0;
          return !isPicked && cCount < 3 && p.price <= maxAllowedPrice;
        });

        if (candidates.length === 0) {
          success = false;
          break; // Try again
        }

        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        selected[slot.id] = {
          name: chosen.name,
          team: chosen.team,
          position: chosen.position,
          price: chosen.price,
          number: chosen.number
        };
        countryCounts[chosen.team] = (countryCounts[chosen.team] || 0) + 1;
        totalPrice += chosen.price;
      }

      if (success && totalPrice <= 100.0) {
        setSquad(selected);
        setCaptainSlot('GK1');
        setMessage({ type: 'success', text: "🎉 Auto-selected a valid 15-player squad! Don't forget to Save." });
        setTimeout(() => setMessage(null), 4000);
        return;
      }
    }

    alert("Failed to auto-select a valid squad within budget. Please try again.");
  };

  const handleSaveSquad = async () => {
    if (filledCount !== 15) {
      setMessage({ type: 'error', text: 'Please fill all 15 player positions (11 starters and 4 bench).' });
      return;
    }
    if (countryWarning) {
      setMessage({ type: 'error', text: `Too many players from ${countryWarning[0]} (${countryWarning[1]}). Max 3 allowed.` });
      return;
    }
    if (budgetRemaining < 0) {
      setMessage({ type: 'error', text: 'Insufficient budget! Your team value exceeds the $100.0M limit.' });
      return;
    }
    if (startingSlots.some(slot => !squad[slot.id])) {
      setMessage({ type: 'error', text: 'Please fill all 11 starting positions.' });
      return;
    }
    if (!captainSlot || !squad[captainSlot]) {
      setMessage({ type: 'error', text: 'Please designate a Captain from your starting XI.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const playersArr = Object.entries(squad).map(([slot, player]) => ({
        slot,
        name: player.name,
        team: player.team,
        position: player.position,
        price: player.price,
        number: player.number || '10',
        isStarting: isSlotStarting(slot, formation),
        isCaptain: slot === captainSlot
      }));

      const squadDoc = {
        userId: user.uid,
        userName: user.displayName || user.name || 'Anonymous',
        userEmail: user.email,
        players: playersArr,
        formation: formation,
        budgetRemaining: Number(budgetRemaining.toFixed(1)),
        updatedAt: new Date().toISOString()
      };

      if (user.isMock || !db) {
        localStorage.setItem(`mock_dream_team_${user.uid}`, JSON.stringify(squadDoc));
        setMessage({ type: 'success', text: '🎉 Squad saved locally!' });
        setTimeout(() => setMessage(null), 3500);
      } else {
        try {
          const dtRef = doc(db, 'dream_teams', user.uid);
          await setDoc(dtRef, squadDoc);
          setMessage({ type: 'success', text: '🎉 Dream Team saved successfully!' });
          setTimeout(() => setMessage(null), 3500);
        } catch (firestoreErr) {
          console.error('Firestore save failed:', firestoreErr);
          // Fall back to localStorage so the squad is never lost
          localStorage.setItem(`dream_team_backup_${user.uid}`, JSON.stringify(squadDoc));
          
          const code = firestoreErr?.code || '';
          if (code === 'permission-denied') {
            setMessage({ 
              type: 'error', 
              text: '⚠️ Permission denied. Your squad was saved locally as a backup. This can happen if your account profile is incomplete — try signing out and back in.'
            });
          } else {
            setMessage({ 
              type: 'error', 
              text: `⚠️ Cloud save failed (${code || 'unknown error'}). Squad backed up locally. Please try again shortly.`
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: `Failed to save squad: ${err.message || 'unknown error'}` });
    } finally {
      setSaving(false);
    }
  };

  // Autocomplete search list filtering
  const getFilteredPlayers = () => {
    if (!activeSlot) return [];
    
    // Flat list of players of this position
    const playersList = [];
    Object.entries(squadData).forEach(([country, players]) => {
      if (selectedCountry && selectedCountry !== country) return;
      
      players.forEach(p => {
        if (p.position === activeSlot.position) {
          playersList.push({
            name: p.name,
            team: country,
            position: p.position,
            number: p.number,
            price: p.price || 5.0
          });
        }
      });
    });

    let filtered = playersList.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort options
    if (sortByPrice === 'desc') {
      filtered.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    } else if (sortByPrice === 'asc') {
      filtered.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const filteredPlayers = getFilteredPlayers();
  const sortedCountries = Object.keys(squadData).sort();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold tracking-wide text-sm">Loading your FIFA Fantasy Dream Team...</p>
      </div>
    );
  }

  return (
    <div className="w-full page-enter text-center px-2 pb-10">
      
      {/* Title */}
      <h1 className="font-display text-4xl font-black tracking-widest text-center uppercase mb-1.5 select-none bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
        FIFA FANTASY DREAM TEAM
      </h1>
      <p className="text-xs text-[#F5C518] uppercase tracking-widest font-extrabold mb-4 select-none">
        Build your squad • Manage starting XI • Select Captain
      </p>

      {/* How to Play Trigger */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => setShowHowToPlayModal(true)}
          className="h-[36px] py-1.5 px-4 bg-[#F5C518]/10 hover:bg-[#F5C518]/25 text-[#F5C518] border border-[#F5C518]/25 hover:border-[#F5C518]/45 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How to Play</span>
        </button>
      </div>

      {/* Top Banner Status */}
      <div className="max-w-4xl mx-auto mb-6">
        {rankings ? (
          <div className="bg-gradient-to-r from-amber-600/25 to-yellow-600/20 border border-[#F5C518]/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-lg select-none">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center text-[#F5C518] trophy-float">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dream Team Points Resolved</h3>
                <p className="text-[10px] text-gray-300 font-sans mt-0.5">Points have been added to your profile standings.</p>
              </div>
            </div>
            <div className="bg-[#0A0E1A] px-5 py-2.5 rounded-xl border border-[#F5C518]/20 text-center flex-shrink-0">
              <span className="text-[9px] text-gray-400 font-mono font-bold block uppercase tracking-wide">TOTAL DT POINTS</span>
              <span className="text-2xl font-black text-[#F5C518] font-mono tracking-tight">+{userTotalPoints}</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              {isLocked ? (
                <Lock className="w-5 h-5 text-red-400 flex-shrink-0" />
              ) : (
                <Calendar className="w-5 h-5 text-[#F5C518] flex-shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isLocked ? "🔒 Team Locked" : "✏️ Pick Before Tournament"}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {isLocked 
                    ? "Submissions are closed. Rankings will be uploaded after match day 1."
                    : "Choose 15 players: 2 GK, 5 DF, 5 MF, 3 FW. Max 3 players per country. Budget $100.0M."}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase border shrink-0 whitespace-nowrap tracking-wider font-sans ${
              isLocked 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : 'bg-[#F5C518]/10 text-[#F5C518] border-[#F5C518]/25 shadow-[0_0_12px_rgba(245,197,24,0.05)]'
            }`}>
              {countdownText}
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`max-w-4xl mx-auto p-4 mb-6 rounded-xl border text-xs text-left flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-950/20 border-green-500/20 text-green-400' 
            : 'bg-red-950/20 border-red-500/20 text-red-400'
        }`}>
          <span>{message.type === 'success' ? '🎉' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Pitch left/center, config details side */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FOOTBALL PITCH SECTION */}
        <div className="lg:col-span-7 flex flex-col items-center select-none space-y-4">
          
          {/* Pitch Control Bar (Formation and Auto Select) */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-between items-stretch sm:items-center select-none">
            {/* Formation selector tab */}
            <div className="flex bg-[#111827]/80 border border-white/10 p-1.5 rounded-2xl items-center justify-between flex-1 w-full shadow-lg">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-3 tracking-wider mr-2">Formation:</span>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {Object.keys(FORMATION_CONFIGS).map(form => (
                  <button
                    key={form}
                    disabled={isLocked}
                    onClick={() => setFormation(form)}
                    className={`py-1.5 px-3 text-center rounded-xl text-[11px] font-extrabold font-mono transition-all duration-200 border-none cursor-pointer shrink-0 ${
                      formation === form
                        ? 'bg-[#F5C518] text-[#0A0E1A] shadow-md transform scale-[1.02]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Select Button */}
            {!isLocked && (
              <button
                type="button"
                onClick={autoSelectSquad}
                className="w-full sm:w-auto h-[46px] py-2.5 px-5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition duration-300 flex items-center justify-center gap-1.5 border-none shadow-[0_4px_16px_rgba(245,197,24,0.2)] hover:shadow-[0_6px_20px_rgba(245,197,24,0.3)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Auto Select</span>
              </button>
            )}
          </div>

          {/* 2D Pitch container */}
          <div className="relative w-full max-w-lg aspect-[3/4] bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-3xl p-4 border-4 border-emerald-600/40 shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Pitch Grass Stripes */}
            <div className="pitch-stripes" />

            {/* Pitch markings */}
            <div className="absolute inset-3 border-2 border-white/15 pointer-events-none rounded-2xl">
              <div className="absolute top-1/2 left-0 right-0 border-t-2 border-white/15" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/15 rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-24 border-b-2 border-x-2 border-white/15" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-24 border-t-2 border-x-2 border-white/15" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/25 rounded-full" />
            </div>

            {/* Players slots rendered absolutely */}
            {startingSlots.map(slot => {
              const player = squad[slot.id];
              const pointsData = player && userPointsBreakdown ? userPointsBreakdown[player.name] : null;
              const isCaptain = slot.id === captainSlot;

              return (
                <div 
                  key={slot.id} 
                  className="absolute flex flex-col items-center z-10"
                  style={slot.style}
                >
                  <button
                    disabled={isLocked && !player}
                    onClick={() => {
                      if (isLocked) return;
                      if (player) {
                        setSelectedPlayerSlot(slot.id);
                      } else {
                        setActiveSlot(slot);
                      }
                    }}
                    className="relative flex items-center justify-center transition duration-300 transform active:scale-95 border-none cursor-pointer bg-transparent outline-none focus:outline-none p-0"
                  >
                    <Jersey2D 
                      team={player?.team} 
                      number={player?.number || '10'} 
                      isFilled={!!player} 
                      isLocked={isLocked} 
                    />

                    {/* Captain Star Indicator */}
                    {isCaptain && (
                      <span className="absolute -top-1 -left-1 bg-gradient-to-r from-amber-400 to-yellow-500 border border-black rounded-full p-0.5 text-black font-extrabold w-4 h-4 flex items-center justify-center text-[8px] shadow-lg z-20">
                        C
                      </span>
                    )}

                    {/* Points indicator */}
                    {pointsData && (
                      <span className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-[9px] font-black font-mono flex items-center justify-center shadow-lg border border-[#0A0E1A] z-20 ${
                        pointsData.points > 0 
                          ? 'bg-[#F5C518] text-[#0A0E1A]' 
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        +{pointsData.points}
                      </span>
                    )}
                  </button>

                  {/* Player details tag below jersey */}
                  <div className="mt-1.5 flex flex-col items-center select-none">
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-white tracking-wide uppercase px-2.5 py-1 bg-gray-950/80 rounded-lg border border-white/10 font-sans shadow-md backdrop-blur-sm truncate max-w-[75px] sm:max-w-[90px] text-center">
                      {player ? player.name.split(' ').pop() : slot.label}
                    </span>
                    {player && (
                      <span className="text-[8px] font-mono font-black text-[#F5C518] mt-1 bg-gray-950/50 px-1.5 py-0.5 rounded-md border border-[#F5C518]/15 shadow-sm">
                        ${player.price}M
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* BENCH PANEL CONTAINER */}
          <div className="bg-[#111827]/60 border border-white/10 rounded-3xl p-5 flex flex-col text-left space-y-4 shadow-xl backdrop-blur-md w-full max-w-lg">
            <span className="text-[10px] font-black text-[#F5C518] uppercase tracking-widest block font-sans border-b border-white/5 pb-2 select-none">
              SUBS / BENCH (4 players)
            </span>
            <div className="grid grid-cols-4 gap-3 pt-1 select-none">
              {benchSlots.map(slot => {
                const player = squad[slot.id];
                const pointsData = player && userPointsBreakdown ? userPointsBreakdown[player.name] : null;

                return (
                  <div 
                    key={slot.id} 
                    onClick={() => {
                      if (isLocked) return;
                      if (player) {
                        setSelectedPlayerSlot(slot.id);
                      } else {
                        setActiveSlot(slot);
                      }
                    }}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      player
                        ? 'bg-gray-950/40 border-white/10 hover:border-[#F5C518]/45 hover:bg-gray-950/60'
                        : 'bg-black/20 border-dashed border-white/10 hover:border-[#F5C518]/30 hover:bg-white/5'
                    }`}
                  >
                    <Jersey2D 
                      team={player?.team} 
                      number={player?.number || '10'} 
                      isFilled={!!player} 
                      isLocked={isLocked}
                      sizeClass="w-10 h-10"
                    />
                    
                    <span className="text-[10px] font-extrabold text-white mt-1.5 text-center truncate max-w-[65px] uppercase">
                      {player ? player.name.split(' ').pop() : slot.label}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-gray-400 mt-0.5">
                      {player ? `$${player.price}M` : 'Bench'}
                    </span>

                    {pointsData && (
                      <span className="text-[9px] font-black text-[#F5C518] mt-1 font-mono">
                        ({pointsData.points} PTS)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* SIDE BAR DETAILS & CONFIG */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* BUDGET BAR & SQUAD COMPOSITION */}
          <div className="bg-[#111827]/50 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5 text-left">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 select-none">
              Squad Composition
            </h3>

            {/* Selection indicators */}
            <div className="grid grid-cols-2 gap-3 text-xs select-none">
              <div className="bg-[#0A0E1A] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Squad size</span>
                <span className="text-xl font-black text-white font-sans tracking-tight mt-1">{filledCount} / 15</span>
              </div>
              <div className="bg-[#0A0E1A] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Value / Budget</span>
                <span className="text-xl font-black text-white font-sans tracking-tight mt-1">${totalSquadValue.toFixed(1)}M / $100.0M</span>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-2 select-none">
              <div className="flex justify-between text-[10px] font-bold tracking-wider">
                <span className="text-gray-400 font-sans">BUDGET EXPENDITURE</span>
                <span className={`font-sans ${budgetRemaining < 0 ? "text-red-400" : "text-[#F5C518]"}`}>
                  {budgetRemaining < 0 
                    ? `OVER BUDGET: -$${Math.abs(budgetRemaining).toFixed(1)}M` 
                    : `$${budgetRemaining.toFixed(1)}M REMAINING`}
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    budgetRemaining < 0 
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                      : 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_8px_rgba(245,197,24,0.4)]'
                  }`}
                  style={{ width: `${Math.min(100, (totalSquadValue / 100) * 100)}%` }}
                />
              </div>
            </div>

            {/* Outfield / GK validation indicators */}
            <div className="space-y-1 text-[10px] font-sans text-gray-400">
              <div className="flex justify-between">
                <span>Goalkeepers (GK)</span>
                <span className={Object.values(squad).filter(p => p.position === 'GK').length === 2 ? "text-green-400 font-bold" : "text-gray-400"}>
                  {Object.values(squad).filter(p => p.position === 'GK').length} / 2 selected
                </span>
              </div>
              <div className="flex justify-between">
                <span>Defenders (DF)</span>
                <span className={Object.values(squad).filter(p => p.position === 'DF').length === 5 ? "text-green-400 font-bold" : "text-gray-400"}>
                  {Object.values(squad).filter(p => p.position === 'DF').length} / 5 selected
                </span>
              </div>
              <div className="flex justify-between">
                <span>Midfielders (MF)</span>
                <span className={Object.values(squad).filter(p => p.position === 'MF').length === 5 ? "text-green-400 font-bold" : "text-gray-400"}>
                  {Object.values(squad).filter(p => p.position === 'MF').length} / 5 selected
                </span>
              </div>
              <div className="flex justify-between">
                <span>Forwards (FW)</span>
                <span className={Object.values(squad).filter(p => p.position === 'FW').length === 3 ? "text-green-400 font-bold" : "text-gray-400"}>
                  {Object.values(squad).filter(p => p.position === 'FW').length} / 3 selected
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                <span>Starting Players</span>
                <span className="text-white font-bold font-mono">11</span>
              </div>
              <div className="flex justify-between">
                <span>Captain selected</span>
                <span className={captainSlot ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
                  {captainSlot ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Country Limits list */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block select-none">Country Representation</span>
              {Object.keys(countryCounts).length === 0 ? (
                <span className="text-xs text-gray-500 block italic select-none">No players picked yet.</span>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto pr-1.5 scrollbar-thin select-none">
                  {Object.entries(countryCounts).map(([country, count]) => (
                    <div 
                      key={country} 
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold font-sans transition-all duration-150 ${
                        count > 3 
                          ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.05)]' 
                          : count === 3
                          ? 'bg-[#F5C518]/15 text-[#F5C518] border-[#F5C518]/30 shadow-[0_0_8px_rgba(245,197,24,0.05)]'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">{countryFlags[country] || '🏳️'}</span>
                      <span className="tracking-wide">{countryCodes[country] || country}</span>
                      <span className="font-sans font-black text-white">({count}/3)</span>
                    </div>
                  ))}
                </div>
              )}
              {countryWarning && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-red-950/20 border border-red-500/25 rounded-lg text-red-400 text-[10px] select-none">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Maximum of 3 players allowed per country! Remove player(s) from {countryWarning[0]}.</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isLocked && (
              <div className="flex gap-3 pt-2 select-none">
                <button
                  onClick={handleResetSquad}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black py-3.5 px-5 rounded-2xl text-xs uppercase tracking-widest transition-all duration-200 border border-red-500/20 hover:border-red-500/40 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveSquad}
                  disabled={saving || filledCount !== 15 || countryWarning || budgetRemaining < 0}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-black font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 border-none shadow-[0_4px_16px_rgba(245,197,24,0.15)] hover:shadow-[0_6px_20px_rgba(245,197,24,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {saving ? (
                    <span className="font-sans">Saving...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Squad</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* OFFICIAL TOP 10 RANKINGS DISPLAY (IF PUBLISHED) */}
          {rankings && (
            <div className="card space-y-4 text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F5C518]" />
                <span>Official Top 10 Standings (Day 1)</span>
              </h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {['GK', 'DF', 'MF', 'FW'].map(pos => {
                  const list = rankings[pos] || [];
                  const title = pos === 'GK' ? 'Goalkeepers' : pos === 'DF' ? 'Defenders' : pos === 'MF' ? 'Midfielders' : 'Forwards';
                  
                  return (
                    <div key={pos} className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#F5C518] uppercase font-mono tracking-wider block">{title}</span>
                      <div className="space-y-1 text-xs">
                        {list.map((name, index) => {
                          const isUserPick = Object.values(squad).some(p => p.name.toLowerCase() === name.toLowerCase());
                          return (
                            <div 
                              key={index} 
                              className={`flex items-center justify-between p-2 rounded-lg border font-medium ${
                                isUserPick 
                                  ? 'bg-[#F5C518]/10 text-white border-[#F5C518]/30 font-bold' 
                                  : 'bg-white/2 text-gray-400 border-white/2'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-gray-500 font-bold w-4">#{index + 1}</span>
                                <span>{name}</span>
                              </div>
                              <span className="font-mono text-[10px] font-bold">+{10 - index} pts</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELECT PLAYER MODAL / DRAWER */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full border border-white/10 bg-[#0F1520] rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between select-none">
              <div className="text-left">
                <span className="text-[9px] bg-[#F5C518]/10 text-[#F5C518] px-2 py-0.5 rounded font-extrabold uppercase border border-[#F5C518]/25 font-mono">
                  {activeSlot.position} SELECTION
                </span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-1">
                  Choose {activeSlot.position === 'GK' ? 'Goalkeeper' : activeSlot.position === 'DF' ? 'Defender' : activeSlot.position === 'MF' ? 'Midfielder' : 'Forward'}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setActiveSlot(null);
                  setSearchTerm('');
                  setSelectedCountry('');
                }}
                className="text-gray-400 hover:text-white border-none bg-transparent cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter controls */}
            <div className="p-4 border-b border-white/5 space-y-3 bg-[#0A0E1A]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search player name..."
                  className="w-full bg-[#111827] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div className="flex gap-2 items-center">
                {/* Country Filter */}
                <div className="flex-1 flex items-center gap-1.5 bg-[#111827] border border-white/10 rounded-xl px-2.5 py-1.5">
                  <Flag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full bg-transparent border-none p-0.5 text-xs text-white focus:outline-none font-sans"
                  >
                    <option value="" className="bg-[#111827]">All Countries</option>
                    {sortedCountries.map(c => (
                      <option key={c} value={c} className="bg-[#111827]">
                        {countryFlags[c] || '🏳️'} {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setSortByPrice(prev => prev === 'desc' ? 'asc' : prev === 'asc' ? 'none' : 'desc');
                  }}
                  className="flex items-center gap-1 bg-[#111827] hover:bg-[#111827]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 transition duration-300"
                >
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">Price</span>
                  {sortByPrice === 'desc' ? (
                    <span className="text-[#F5C518] font-bold">↓</span>
                  ) : sortByPrice === 'asc' ? (
                    <span className="text-[#F5C518] font-bold">↑</span>
                  ) : (
                    <span className="text-gray-500 font-bold">-</span>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Player List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs italic">
                  No matching players found.
                </div>
              ) : (
                filteredPlayers.map((player, index) => {
                  // Check duplicate selection
                  const isPicked = Object.values(squad).some(
                    p => p.name.toLowerCase() === player.name.toLowerCase() && p.team === player.team
                  );
                  // Check country limit
                  const countForCountry = countryCounts[player.team] || 0;
                  const activeSlotCurrentPlayer = squad[activeSlot.id];
                  const isReplacingSameCountry = activeSlotCurrentPlayer && activeSlotCurrentPlayer.team === player.team;
                  const countryLimitReached = countForCountry >= 3 && !isReplacingSameCountry;

                  return (
                    <button
                      key={index}
                      disabled={isPicked || countryLimitReached}
                      onClick={() => selectPlayer(player)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left border-none ${
                        isPicked 
                          ? 'bg-white/2 border-white/5 opacity-40 cursor-not-allowed'
                          : countryLimitReached
                          ? 'bg-red-950/5 border-red-500/10 opacity-40 cursor-not-allowed'
                          : 'bg-[#111827]/40 hover:bg-white/5 border-white/5 hover:border-[#F5C518]/30 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-300 font-mono text-xs font-bold border border-white/10">
                          {player.number}
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block leading-none">{player.name}</span>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {countryFlags[player.team] || '🏳️'} {player.team}
                          </span>
                        </div>
                      </div>

                      {/* Right side Price & CTA state */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#F5C518] bg-black/40 px-2 py-1 rounded-lg">
                          ${player.price}M
                        </span>
                        <div>
                          {isPicked ? (
                            <span className="text-[8px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded font-bold font-mono">PICKED</span>
                          ) : countryLimitReached ? (
                            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded font-bold font-mono">MAX 3</span>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center text-[#F5C518] hover:bg-[#F5C518] hover:text-[#0A0E1A] transition">
                              <span className="text-[10px] font-black">+</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* SELECTED PLAYER ACTIONS DETAIL MODAL */}
      {selectedPlayerSlot && squad[selectedPlayerSlot] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedPlayerSlot(null)}
        >
          <div 
            className="card max-w-sm w-full border border-white/10 bg-[#0F1520] rounded-3xl shadow-2xl relative p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close */}
            <button 
              onClick={() => setSelectedPlayerSlot(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Player details */}
            <div className="flex flex-col items-center text-center space-y-2 mt-2 select-none">
              <span className="text-3xl">{countryFlags[squad[selectedPlayerSlot].team] || '🏳️'}</span>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">{squad[selectedPlayerSlot].name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{squad[selectedPlayerSlot].team} • {squad[selectedPlayerSlot].position}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] font-mono font-bold text-[#F5C518] bg-[#F5C518]/5 border border-[#F5C518]/20 px-2 py-0.5 rounded">
                  Price: ${squad[selectedPlayerSlot].price}M
                </span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                  isSlotStarting(selectedPlayerSlot, formation)
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isSlotStarting(selectedPlayerSlot, formation) ? 'Starting XI' : 'Bench'}
                </span>
              </div>
            </div>

            {/* Actions List */}
            <div className="space-y-2 pt-2">
              {/* Make Captain Option (Only if Starting) */}
              {isSlotStarting(selectedPlayerSlot, formation) && selectedPlayerSlot !== captainSlot && (
                <button
                  onClick={() => {
                    setCaptainSlot(selectedPlayerSlot);
                    setSelectedPlayerSlot(null);
                  }}
                  className="w-full bg-[#F5C518]/10 hover:bg-[#F5C518]/20 text-[#F5C518] font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-[#F5C518]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Make Captain</span>
                </button>
              )}

              {/* Swap/Substitution Options */}
              {isSlotStarting(selectedPlayerSlot, formation) ? (
                // Show bench options to swap with
                benchSlots
                  .filter(bs => squad[bs.id] && squad[bs.id].position === squad[selectedPlayerSlot].position)
                  .map(bs => (
                    <button
                      key={bs.id}
                      onClick={() => swapSlots(selectedPlayerSlot, bs.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-white/5 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Swap with {squad[bs.id].name.split(' ').pop()} (Bench)</span>
                    </button>
                  ))
              ) : (
                // Show starting options to swap with
                startingSlots
                  .filter(ss => squad[ss.id] && squad[ss.id].position === squad[selectedPlayerSlot].position)
                  .map(ss => (
                    <button
                      key={ss.id}
                      onClick={() => swapSlots(selectedPlayerSlot, ss.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-white/5 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Swap with {squad[ss.id].name.split(' ').pop()} (Start)</span>
                    </button>
                  ))
              )}

              {/* Move to empty slot if possible */}
              {isSlotStarting(selectedPlayerSlot, formation) ? (
                // If benched slot is empty, we can just move it
                benchSlots
                  .filter(bs => !squad[bs.id] && bs.position === squad[selectedPlayerSlot].position)
                  .slice(0, 1)
                  .map(bs => (
                    <button
                      key={bs.id}
                      onClick={() => swapSlots(selectedPlayerSlot, bs.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-white/5 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Move to Bench</span>
                    </button>
                  ))
              ) : (
                // If starting slot is empty, we can just move it
                startingSlots
                  .filter(ss => !squad[ss.id] && ss.position === squad[selectedPlayerSlot].position)
                  .slice(0, 1)
                  .map(ss => (
                    <button
                      key={ss.id}
                      onClick={() => swapSlots(selectedPlayerSlot, ss.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-white/5 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Move to Starting XI</span>
                    </button>
                  ))
              )}

              {/* Remove from Squad */}
              <button
                onClick={() => {
                  removePlayer(selectedPlayerSlot);
                  setSelectedPlayerSlot(null);
                }}
                className="w-full bg-red-500/10 hover:bg-red-500/25 text-red-400 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-red-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Remove from Squad</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Play Dream Team Modal */}
      {showHowToPlayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setShowHowToPlayModal(false)}>
          <div 
            className="card max-w-lg w-full border border-white/10 bg-[#0F1520] rounded-3xl shadow-2xl relative p-6 sm:p-8 space-y-6 text-left"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Modal Close */}
            <button 
              onClick={() => setShowHowToPlayModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center text-[#F5C518]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                  🏆 DREAM TEAM RULES
                </h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">How to Build & Score points</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Squad Composition</h4>
                <p>You must select exactly <strong>15 players</strong> in total to complete your squad:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li><strong>2 Goalkeepers</strong> (GK)</li>
                  <li><strong>5 Defenders</strong> (DF)</li>
                  <li><strong>5 Midfielders</strong> (MF)</li>
                  <li><strong>3 Forwards</strong> (FW)</li>
                </ul>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Starting XI & Formations</h4>
                <p>Choose a formation (e.g. 4-4-2, 4-3-3, 3-5-2) to place <strong>11 players in your Starting XI</strong>. The remaining 4 players will automatically sit on the <strong>Bench / Substitutes</strong>.</p>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Budget & Country Constraints</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li><strong>$100.0M Budget</strong>: The total price of all 15 players must not exceed $100.0M.</li>
                  <li><strong>Max 3 Per Country</strong>: You can select a maximum of 3 players from any single national team.</li>
                </ul>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Captain (Double Points)</h4>
                <p>Designate one player in your <strong>Starting XI</strong> as your <strong>Captain</strong>. Your Captain will earn <strong>double (2x)</strong> their base points for the match day.</p>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">5. Scoring Points</h4>
                <p>Points are awarded when the tournament admin publishes the official <strong>Top 10 Player Rankings</strong> for each position:</p>
                <div className="bg-[#0A0E1A] p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 font-mono text-[10px] text-gray-400">
                  <div className="flex justify-between text-[#F5C518] font-bold">
                    <span>Rank 1 (Best in position)</span>
                    <span>+10 PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rank 2</span>
                    <span>+9 PTS</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>...</span>
                    <span>...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rank 10</span>
                    <span>+1 PTS</span>
                  </div>
                </div>
                <p className="text-amber-400 font-semibold mt-1">⚠️ CRUCIAL: Only players in your Starting XI earn points! Benched players score 0 points even if they are in the Top 10 rankings.</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex">
              <button
                type="button"
                onClick={() => setShowHowToPlayModal(false)}
                className="w-full h-11 bg-[#F5C518] text-[#0A0E1A] font-black uppercase text-xs tracking-widest rounded-xl transition duration-200 border-none cursor-pointer"
              >
                Let's Play!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
