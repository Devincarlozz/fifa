// src/components/admin/DreamTeamRankingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { squadData } from '../../utils/tournamentData';
import { processDreamTeamRankings } from '../../utils/dreamTeamCalc';
import { Award, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DreamTeamRankingsPanel({ adminEmail }) {
  const [rankings, setRankings] = useState({
    GK: Array(10).fill(''),
    DF: Array(10).fill(''),
    MF: Array(10).fill(''),
    FW: Array(10).fill('')
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activePositionTab, setActivePositionTab] = useState('GK');

  // Fetch existing rankings on mount
  useEffect(() => {
    async function fetchExistingRankings() {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'system', 'dream_team_rankings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rankings) {
            // Merge with default blank arrays to handle any structural issues
            setRankings({
              GK: data.rankings.GK || Array(10).fill(''),
              DF: data.rankings.DF || Array(10).fill(''),
              MF: data.rankings.MF || Array(10).fill(''),
              FW: data.rankings.FW || Array(10).fill('')
            });
          }
        }
      } catch (err) {
        console.error("Error fetching dream team rankings:", err);
        setError("Failed to load existing rankings from database.");
      } finally {
        setLoading(false);
      }
    }
    fetchExistingRankings();
  }, []);

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

  // Group players by country for dropdown organization
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
      await processDreamTeamRankings(rankings, adminEmail);
      setSuccess("✅ Dream Team Rankings published! Point calculations completed successfully for all users.");
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
        <span className="text-xs text-gray-400">Loading rankings...</span>
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

  return (
    <div className="space-y-6">
      <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#F5C518] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wide">About Dream Team Calculations</h4>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            Select the top 10 players for each position based on the first match day's performance. Ranks are mapped to points: Rank 1 gives 10 points down to Rank 10 giving 1 point. Once published, all users' dream teams will be automatically evaluated, points will be added to their leaderboard profiles, and standings will refresh.
          </p>
        </div>
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

      <form onSubmit={handlePublishRankings} className="card space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F5C518]" />
            <span>Select Top 10 Players per Position</span>
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
                activePositionTab === pos
                  ? 'bg-white/5 text-[#F5C518]'
                  : 'text-gray-400 hover:text-white hover:bg-white/2'
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
    </div>
  );
}
