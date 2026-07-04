import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import LiveMatchBanner from './LiveMatchBanner';
import MatchCard from './MatchCard';
import FifaTrophyHero from './FifaTrophyHero';
import { Calendar, Award } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [allMatches, setAllMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

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
      setAllMatches(matchesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches in real-time:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to user predictions in real-time
  useEffect(() => {
    if (!user || !db) return;
    
    const q = query(collection(db, 'predictions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const predsMap = {};
      querySnapshot.forEach((doc) => {
        const pred = doc.data();
        predsMap[pred.matchId] = {
          id: doc.id,
          ...pred
        };
      });
      setPredictions(predsMap);
    }, (error) => {
      console.error("Error listening to predictions:", error);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold tracking-wide text-sm">Loading tournament dashboard...</p>
      </div>
    );
  }

  // Filter matches into Scheduled and Completed
  const upcomingMatches = allMatches.filter(m => m.status === 'SCHEDULED');
  const completedMatches = allMatches.filter(m => m.status === 'FINISHED' || m.status === 'CONFIRMED' || m.confirmed);
  const liveInProgressMatches = allMatches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'LIVE');

  // Featured match logic:
  // 1. Show live in-progress match first.
  // 2. If no live, show first upcoming match.
  // 3. If no upcoming, show first completed match.
  const featuredMatch = liveInProgressMatches[0] || upcomingMatches[0] || completedMatches[0] || null;

  return (
    <div className="space-y-8 w-full page-enter">
      {/* 3D Trophy Hero Header */}
      <FifaTrophyHero />
      
      {/* Empty State when no matches exist */}
      {allMatches.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">No tournament matches found in Firestore.</p>
        </div>
      )}

      {/* Main Featured Banner */}
      {featuredMatch && (
        <LiveMatchBanner 
          match={featuredMatch} 
          prediction={predictions[featuredMatch.matchId || featuredMatch.id]} 
        />
      )}

      {/* In Progress Fixtures */}
      {liveInProgressMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="font-display text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500 animate-pulse" />
              <span>In Progress</span>
            </h2>
            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/25 uppercase tracking-wider">
              {liveInProgressMatches.length} Matches
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveInProgressMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.matchId || match.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Fixtures */}
      {upcomingMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="font-display text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F5C518]" />
              <span>Upcoming Fixtures</span>
            </h2>
            <span className="text-[10px] bg-[#F5C518]/10 text-[#F5C518] px-2 py-0.5 rounded font-bold border border-[#F5C518]/25 uppercase tracking-wider">
              {upcomingMatches.length} Pending
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.matchId || match.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {completedMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="font-display text-lg font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-500" />
              <span>Recent Results</span>
            </h2>
            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-bold border border-white/10 uppercase tracking-wider">
              {completedMatches.length} Completed
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.matchId || match.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
