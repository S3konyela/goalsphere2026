import { useEffect, useState } from 'react';
import { fetchLeaderboard, scoreAllPredictions } from '../services/predictions.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_LABEL = ['1st', '2nd', '3rd'];

function SkeletonRow() {
  return (
    <div className="lb-row lb-row--skeleton">
      <div className="lb-skeleton-rank" />
      <div className="lb-skeleton-avatar" />
      <div className="lb-skeleton-name" />
      <div className="lb-skeleton-points" />
      <div className="lb-skeleton-bar" />
    </div>
  );
}

function PodiumCard({ player, rank }) {
  const modifier = rank === 1 ? 'first' : rank === 2 ? 'second' : 'third';
  return (
    <div className={`lb-pod lb-pod--${modifier}`}>
      <div className="lb-pod-medal">{MEDAL[rank - 1]}</div>
      <div className="lb-pod-avatar">{player.user_name[0].toUpperCase()}</div>
      <div className="lb-pod-name">{player.user_name}</div>
      <div className="lb-pod-points">{player.points} pts</div>
      <div className="lb-pod-plinth">{MEDAL_LABEL[rank - 1]}</div>
    </div>
  );
}

function reload(setPlayers, setLoading, setError) {
  setLoading(true);
  setError(null);
  fetchLeaderboard()
    .then(setPlayers)
    .catch(err => setError(err.message || 'Failed to load leaderboard'))
    .finally(() => setLoading(false));
}

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    reload(setPlayers, setLoading, setError);
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const { scored, skipped, errors } = await scoreAllPredictions();
      setSyncMsg(`✓ ${scored} updated, ${skipped} unchanged${errors ? `, ${errors} errors` : ''}`);
      reload(setPlayers, setLoading, setError);
    } catch (err) {
      setSyncMsg(`⚠ ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  const maxPoints = players[0]?.points || 1;

  return (
    <div className="lb-page">
      <div className="lb-page-header">
        <div className="container">
          <span className="section-eyebrow">Rankings</span>
          <h1 className="lb-page-title">Fan Leaderboard</h1>
          <p className="lb-page-sub">Top predictors ranked by total points earned.</p>
        </div>
      </div>

      <div className="container lb-content">
        {!isSupabaseConfigured && !loading && (
          <div className="info-message">
            Showing sample data — connect Supabase to track real leaderboard rankings.
          </div>
        )}

        {isSupabaseConfigured && (
          <div className="lb-sync-row">
            <button
              className="lb-sync-btn"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Scoring…' : '⚡ Sync Scores'}
            </button>
            {syncMsg && <span className="lb-sync-msg">{syncMsg}</span>}
          </div>
        )}

        {error && (
          <div className="fx-error">
            <span>⚠️</span>
            <div><strong>Could not load leaderboard</strong><p>{error}</p></div>
          </div>
        )}

        {/* Podium — top 3 */}
        {!loading && !error && players.length >= 3 && (
          <div className="lb-podium">
            <PodiumCard player={players[1]} rank={2} />
            <PodiumCard player={players[0]} rank={1} />
            <PodiumCard player={players[2]} rank={3} />
          </div>
        )}

        {/* Full ranked list */}
        <div className="lb-list">
          <div className="lb-list-header">
            <span className="lb-col-rank">Rank</span>
            <span className="lb-col-fan">Fan</span>
            <span className="lb-col-points">Points</span>
            <span className="lb-col-bar">Progress</span>
          </div>

          {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

          {!loading && !error && players.length === 0 && (
            <div className="fx-empty" style={{ padding: '3rem 1rem' }}>
              <span className="fx-empty-icon">🏆</span>
              <h3>No entries yet</h3>
              <p>Be the first to predict and claim the top spot.</p>
            </div>
          )}

          {!loading && !error && players.map((player, i) => (
            <div key={player.user_name} className={`lb-row ${i < 3 ? 'lb-row--top' : ''}`}>
              <div className="lb-rank">
                {i < 3
                  ? <span className="lb-medal">{MEDAL[i]}</span>
                  : <span className="lb-rank-num">#{i + 1}</span>
                }
              </div>
              <div className="lb-avatar">{player.user_name[0].toUpperCase()}</div>
              <div className="lb-name">{player.user_name}</div>
              <div className="lb-points">{player.points} <span>pts</span></div>
              <div className="lb-bar-wrap">
                <div
                  className={`lb-bar-fill ${i === 0 ? 'lb-bar-fill--gold' : i === 1 ? 'lb-bar-fill--silver' : ''}`}
                  style={{ width: `${maxPoints > 0 ? Math.max((player.points / maxPoints) * 100, 4) : 4}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
