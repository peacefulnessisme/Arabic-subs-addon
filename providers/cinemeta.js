const fetch = require('node-fetch');

const CACHE = new Map();

async function getTitleFromImdb(imdbId, type) {
  const cacheKey = `${type}:${imdbId}`;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

  const metaType = type === 'series' ? 'series' : 'movie';
  const url = `https://v3-cinemeta.strem.io/meta/${metaType}/${imdbId}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data && data.meta;
    if (!meta) return null;

    const result = { name: meta.name, year: meta.year || meta.releaseInfo };
    CACHE.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Cinemeta] fetch failed:', err.message);
    return null;
  }
}

module.exports = { getTitleFromImdb };
