// src/components/admin/DreamTeamRankingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, getDocs, collection, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { squadData } from '../../utils/tournamentData';
import { callSaveDreamTeamSettings, callPublishDreamTeamRankings } from '../../services/adminFunctions';
import { Award, Save, RefreshCw, AlertCircle, CheckCircle2, Shield, Users, Clock, Settings, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export default function DreamTeamRankingsPanel({ adminEmail }) {
  const [subTab, setSubTab] = useState('settings'); // 'settings', 'rankings', 'squads'
  const [rankings, setRankings] = useState({
    GK: Array(10).fill(''),
    DF: Array(10).fill(''),
    MF: Array(10).fill(''),
    FW: Array(10).fill('')
  });

  const [phaseSettings, setPhaseSettings] = useState({
    activePhase: 1,
    closingTime: '',
    title: 'Dream Team',
    budget: 100,
    status: 'open'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activePositionTab, setActivePositionTab] = useState('GK');

  // User squads audit states
  const [userSquads, setUserSquads] = useState([]);
  const [loadingSquads, setLoadingSquads] = useState(false);
  const [squadsFilterPhase, setSquadsFilterPhase] = useState(1);
  const [expandedSquadUserId, setExpandedSquadUserId] = useState(null);

  // Fetch settings & rankings on mount
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // Subscribe to settings
    const settingsRef = doc(db, 'system', 'dream_team_settings');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPhaseSettings({
          activePhase: data.activePhase || 1,
          closingTime: data.closingTime || '',
          title: data.title || 'Dream Team',
          budget: data.budget || 100,
          status: data.status || 'open'
        });
        setSquadsFilterPhase(data.activePhase || 1);
      }
    });

    // Fetch existing rankings for currently active phase
    const fetchExistingRankings = async () => {
      try {
        const currentPhase = phaseSettings.activePhase || 1;
        const docRef = doc(db, 'system', `dream_team_rankings_phase${currentPhase}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rankings) {
            setRankings({
              GK: data.rankings.GK || Array(10).fill(''),
              DF: data.rankings.DF || Array(10).fill(''),
              MF: data.rankings.MF || Array(10).fill(''),
              FW: data.rankings.FW || Array(10).fill('')
            });
          }
        } else {
          // Reset if no rankings found for this phase
          setRankings({
            GK: Array(10).fill(''),
            DF: Array(10).fill(''),
            MF: Array(10).fill(''),
            FW: Array(10).fill('')
          });
        }
      } catch (err) {
        console.error("Error fetching dream team rankings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingRankings();

    return () => unsubSettings();
  }, [phaseSettings.activePhase]);

  // Fetch squads when squads tab is opened
  const fetchUserSquads = async () => {
    setLoadingSquads(true);
    setError(null);
    try {
      const dtSnapshot = await getDocs(collection(db, 'dream_teams'));
      const squadsList = [];
      dtSnapshot.forEach((docSnap) => {
        squadsList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setUserSquads(squadsList);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch user squads.");
    } finally {
      setLoadingSquads(false);
    }
  };

  useEffect(() => {
    if (subTab === 'squads') {
      fetchUserSquads();
    }
  }, [subTab]);

  // Helper to extract players by position from tournament data
  const getPlayersByPosition = (pos) => {
    const list = [];
    Object.entries(squadData).forEach(([country, players]) => {
      players.forEach(p => {
        if (p.position === pos) {
          list.push({
            name: p.name,
            team: country,
            position: p.position
          });
        }
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getGroupedPlayers = (pos) => {
    const players = getPlayersByPosition(pos);
    const grouped = {};
    players.forEach(p => {
      if (!grouped[p.team]) grouped[p.team] = [];
      grouped[p.team].push(p);
    });
    return grouped;
  };

  const handlePlayerChange = (pos, index, val) => {
    setRankings(prev => {
      const updatedList = [...prev[pos]];
      updatedList[index] = val;
      return {
        ...prev,
        [pos]: updatedList
      };
    });
    setSuccess(null);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await callSaveDreamTeamSettings(phaseSettings);
      setSuccess("✅ Dream Team settings updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishRankings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validate that all ranks are filled
    for (const [pos, list] of Object.entries(rankings)) {
      const emptyCount = list.filter(name => !name).length;
      if (emptyCount > 0) {
        setError(`Please fill in all 10 ranks for ${pos === 'GK' ? 'Goalkeepers' : pos === 'DF' ? 'Defenders' : pos === 'MF' ? 'Midfielders' : 'Forwards'}.`);
        setSaving(false);
        return;
      }

      // Check for duplicates
      const filled = list.filter(name => name);
      const unique = new Set(filled);
      if (unique.size !== filled.length) {
        setError(`Duplicate players found in the ${pos} rankings. Each player must be unique.`);
        setSaving(false);
        return;
      }
    }

    try {
      await callPublishDreamTeamRankings({ rankings, phase: phaseSettings.activePhase });
      setSuccess(`✅ Dream Team Rankings published for Phase ${phaseSettings.activePhase}! Point calculations completed successfully.`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process and publish rankings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <RefreshCw className="w-8 h-8 text-[#F5C518] animate-spin mb-3" />
        <span className="text-xs text-gray-400">Loading rankings settings...</span>
      </div>
    );
  }

  const groupedPlayersForActiveTab = getGroupedPlayers(activePositionTab);

  const positionName = (pos) => {
    if (pos === 'GK') return 'Goalkeepers';
    if (pos === 'DF') return 'Defenders';
    if (pos === 'MF') return 'Midfielders';
    if (pos === 'FW') return 'Forwards';
    return pos;
  };

  // Filter squads for list
  const filteredSquads = userSquads.filter(squad => {
    const isPhase2 = squad.id.endsWith('_phase2');
    return squadsFilterPhase === 2 ? isPhase2 : !isPhase2;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Sub tabs */}
      <div className="flex bg-[#0A0E1A] p-1 rounded-xl border border-white/5 mb-4">
        <button
          type="button"
          onClick={() => { setSubTab('settings'); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition duration-300 border-none cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'settings' ? 'bg-[#F5C518] text-[#0A0E1A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Phase Settings</span>
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('rankings'); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition duration-300 border-none cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'rankings' ? 'bg-[#F5C518] text-[#0A0E1A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Publish Rankings</span>
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('squads'); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition duration-300 border-none cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'squads' ? 'bg-[#F5C518] text-[#0A0E1A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Squads Audit</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-950/20 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{success}</span>
        </div>
      )}

      {/* SUB-TAB 1: Phase Settings */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="card space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#F5C518]" />
              <span>Configure active Dream Team phase</span>
            </h3>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 font-mono">Active Prediction Phase</label>
              <select
                value={phaseSettings.activePhase}
                onChange={(e) => {
                  const phase = parseInt(e.target.value);
                  setPhaseSettings(prev => ({
                    ...prev,
                    activePhase: phase,
                    title: phase === 2 ? 'Team of the Tournament' : 'Dream Team',
                    budget: phase === 2 ? 200 : 100
                  }));
                }}
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
              >
                <option value={1}>Phase 1: Dream Team (Group/Knockouts, $100M budget)</option>
                <option value={2}>Phase 2: Team of the Tournament (Semis/Final, $200M budget)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 font-mono">Prediction Window Status</label>
              <select
                value={phaseSettings.status}
                onChange={(e) => setPhaseSettings(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
              >
                <option value="open">Open (Users can modify squads)</option>
                <option value="closed">Closed (Squads locked for editing)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 font-mono">Closing / Lock Time (IST)</label>
              <input
                type="datetime-local"
                value={phaseSettings.closingTime}
                onChange={(e) => setPhaseSettings(prev => ({ ...prev, closingTime: e.target.value }))}
                required
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 font-mono">Window Title</label>
              <input
                type="text"
                value={phaseSettings.title}
                onChange={(e) => setPhaseSettings(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 font-mono">Budget Limit ($M)</label>
              <input
                type="number"
                value={phaseSettings.budget}
                onChange={(e) => setPhaseSettings(prev => ({ ...prev, budget: parseInt(e.target.value) || 100 }))}
                className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5C518] font-mono"
              />
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: Publish Rankings */}
      {subTab === 'rankings' && (
        <form onSubmit={handlePublishRankings} className="card space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F5C518]" />
              <span>Publish Rankings for Phase {phaseSettings.activePhase} ({phaseSettings.title})</span>
            </h3>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish & Compute Points'}
            </button>
          </div>

          {/* Position sub-tabs */}
          <div className="flex bg-[#0A0E1A] p-1 rounded-xl border border-white/5">
            {['GK', 'DF', 'MF', 'FW'].map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => setActivePositionTab(pos)}
                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition duration-300 border-none cursor-pointer ${
                  activePositionTab === pos ? 'bg-white/5 text-[#F5C518]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {positionName(pos)}
              </button>
            ))}
          </div>

          {/* 10 slots inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(10).fill(0).map((_, index) => {
              const rank = index + 1;
              const pts = 11 - rank;
              return (
                <div key={index} className="flex items-center gap-3 bg-black/15 p-3 rounded-xl border border-white/5">
                  <span className="font-mono text-xs font-bold text-[#F5C518] w-6 text-center">#{rank}</span>
                  <div className="flex-1">
                    <select
                      value={rankings[activePositionTab][index]}
                      onChange={(e) => handlePlayerChange(activePositionTab, index, e.target.value)}
                      className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#F5C518] font-sans"
                    >
                      <option value="">-- Choose Player --</option>
                      {Object.entries(groupedPlayersForActiveTab).map(([country, countryPlayers]) => (
                        <optgroup key={country} label={country}>
                          {countryPlayers.map(p => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-bold w-12 text-right">+{pts} pts</span>
                </div>
              );
            })}
          </div>
        </form>
      )}

      {/* SUB-TAB 3: User Squads Audit */}
      {subTab === 'squads' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-sm font-bold text-white uppercase tracking-wider">User Dream Team Predictions</span>
              <div className="flex bg-[#0A0E1A] p-0.5 rounded-lg border border-white/5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSquadsFilterPhase(1)}
                  className={`px-3 py-1.5 rounded-md font-bold uppercase transition ${
                    squadsFilterPhase === 1 ? 'bg-white/5 text-[#F5C518]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Phase 1
                </button>
                <button
                  type="button"
                  onClick={() => setSquadsFilterPhase(2)}
                  className={`px-3 py-1.5 rounded-md font-bold uppercase transition ${
                    squadsFilterPhase === 2 ? 'bg-white/5 text-[#F5C518]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Phase 2
                </button>
              </div>
            </div>

            {loadingSquads ? (
              <div className="text-center py-8 text-xs text-gray-400">
                <RefreshCw className="w-6 h-6 text-[#F5C518] animate-spin mx-auto mb-2" />
                <span>Loading squads...</span>
              </div>
            ) : filteredSquads.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">No squads submitted for Phase {squadsFilterPhase} yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredSquads.map((dt) => {
                  const isExpanded = expandedSquadUserId === dt.id;
                  const totalSpent = dt.players?.reduce((sum, p) => sum + (p.price || 5.0), 0) || 0;
                  const budgetLimit = squadsFilterPhase === 2 ? 200 : 100;
                  
                  // Get captain name
                  const captain = dt.players?.find(p => p.isCaptain || p.slot === dt.captainSlot);

                  return (
                    <div key={dt.id} className="py-3.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                        <div className="text-left">
                          <span className="text-white font-bold text-sm block leading-tight">{dt.userName || dt.userEmail}</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">{dt.userEmail}</span>
                        </div>

                        <div className="flex items-center gap-6 justify-between sm:justify-end text-right">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">BUDGET SPENT</span>
                            <span className="text-xs text-white font-mono font-semibold">${totalSpent.toFixed(1)}M / ${budgetLimit}M</span>
                          </div>
                          
                          <div>
                            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">FORMATION</span>
                            <span className="text-xs text-[#F5C518] font-mono font-bold">{dt.formation || '4-4-2'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">POINTS</span>
                            <span className="text-xs text-green-400 font-mono font-bold">+{dt.pointsEarned ?? 0} PTS</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedSquadUserId(isExpanded ? null : dt.id)}
                            className="bg-white/5 border border-white/10 hover:border-[#F5C518]/30 hover:bg-[#F5C518]/10 text-white hover:text-[#F5C518] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Hide' : 'Audit'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Squad details */}
                      {isExpanded && (
                        <div className="bg-[#0A0E1A]/60 border border-white/5 rounded-xl p-4 space-y-3 animate-fadeIn text-left">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5 pb-2 mb-2">
                            <span>Player Name</span>
                            <span>Country</span>
                            <span>Position</span>
                            <span className="text-right">Price</span>
                          </div>
                          <div className="space-y-2">
                            {dt.players?.map((player, idx) => (
                              <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <span className="text-white font-bold flex items-center gap-1.5">
                                  {player.name}
                                  {player.isCaptain && <span className="bg-[#F5C518] text-[#0A0E1A] px-1 py-0.2 rounded text-[8px] font-extrabold uppercase leading-none font-mono">C</span>}
                                  {!player.isStarting && <span className="bg-white/5 text-gray-500 px-1 py-0.2 rounded text-[8px] font-bold uppercase leading-none font-mono">Bench</span>}
                                </span>
                                <span className="text-gray-400 font-semibold">{player.team}</span>
                                <span className="text-gray-500 font-mono">{player.position}</span>
                                <span className="text-right text-[#F5C518] font-mono font-bold">${player.price ? player.price.toFixed(1) : '5.0'}M</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
