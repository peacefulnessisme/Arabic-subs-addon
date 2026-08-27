const fetch = require('node-fetch');
const { getTitleFromImdb } = require('./cinemeta');

const BASE_URL = 'https://api.subsource.net/api/v1';

async function apiGet(path, apiKey) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'X-API-Key': apiKey
    }
  });
  if (!res.ok) {
    console.error('[SubSource] HTTP error', res.status, path);
    return null;
  }
  return res.json();
}

async function findMovieId(imdbId, type, apiKey) {
  const titleInfo = await getTitleFromImdb(imdbId, type);
  if (!titleInfo || !titleInfo.name) return null;

  const qs = new URLSearchParams({ query: titleInfo.name });
  const data = await apiGet(`/movies/search?${qs.toString()}`, apiKey);
  if (!data) return null;

  const list = data.results || data.data || data.movies || [];
  if (!Array.isArray(list) || list.length === 0) return null;

  const exactMatch = list.find(
    (m) => m.imdb_id === imdbId || m.imdbId === imdbId
  );
  const chosen = exactMatch || list[0];
  return chosen ? (chosen.id || chosen.movie_id) : null;
}

async function getSubtitles({ imdbId, type, season, episode, apiKey }) {
  if (!apiKey) return [];

  try {
    const movieId = await findMovieId(imdbId, type, apiKey);
    if (!movieId) return [];

    const qs = new URLSearchParams({
      movie_id: String(movieId),
      language: 'Arabic'
    });
    if (type === 'series' && season) qs.set('season', String(season));
    if (type === 'series' && episode) qs.set('episode', String(episode));

    const data = await apiGet(`/subtitles?${qs.toString()}`, apiKey);
    if (!data) return [];

    const list = data.results || data.data || data.subtitles || [];
    if (!Array.isArray(list)) return [];

    return list.map((sub, index) => {
      const subId = sub.id || sub.subtitle_id;
      return {
        id: `subsource-${subId || index}`,
        url: `${BASE_URL}/subtitles/${subId}/download?api_key=${apiKey}`,
        lang: 'ara'
      };
    });
  } catch (err) {
    console.error('[SubSource] fetch failed:', err.message);
    return [];
  }
}

module.exports = { getSubtitles };
