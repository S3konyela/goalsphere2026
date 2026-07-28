// src/hooks/useTeamFixtures.js
import { useEffect, useState } from 'react';
import { fetchTeamFixtures } from '../services/apiFootball.js';

export function useTeamFixtures(apiFootballId) {
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!apiFootballId) return;
    setLoading(true);
    setError(null);
    fetchTeamFixtures(apiFootballId, { next: 5, last: 5 })
      .then(setFixtures)
      .catch(err => setError(err.message || 'Failed to load fixtures'))
      .finally(() => setLoading(false));
  }, [apiFootballId]);

  return { fixtures, loading, error };
}