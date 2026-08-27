const fetch = require('node-fetch');

const BASE_URL = 'https://api.subdl.com/api/v1/subtitles';
const DOWNLOAD_BASE = 'https://dl.subdl.com';

async function getSubtitles({ imdbId, type, season, episode, apiKey }) {
  if (!apiKey) return [];

  const qs = new URLSearchParams({
    api_key: apiKey,
    imdb_id: imdbId,
    type: type === 'series' ? 'tv' : 'movie',
    languages: 'AR',
    subs_per_page: '30',
    client: 'stremio'
  });

  if (type === 'series' && season) qs.set('season_number', String(season));
  if (type === 'series' && episode) qs.set('episode_number', String(episode));

  const url = `${BASE_URL}?${qs.toString()}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.error('[SubDL] HTTP error', res.status);
      return [];
    }
    const data = await res.json();
    if (!data || data.status !== true || !Array.isArray(data.subtitles)) {
      return [];
    }

    return data.subtitles
      .filter((sub) => !sub.full_season)
      .map((sub, index) => ({
        id: `subdl-${sub.release_name || index}-${index}`,
        url: sub.url.startsWith('http') ? sub.url : `${DOWNLOAD_BASE}${sub.url}`,
        lang: 'ara'
      }));
  } catch (err) {
    console.error('[SubDL] fetch failed:', err.message);
    return [];
  }
}

module.exports = { getSubtitles };
