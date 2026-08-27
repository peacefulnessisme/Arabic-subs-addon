const fetch = require('node-fetch');

const BASE_URL = 'https://api.subdl.com/api/v1/subtitles';
const DOWNLOAD_BASE = 'https://dl.subdl.com';

/**
 * يجيب ترجمات عربية من SubDL
 * @param {object} params
 * @param {string} params.imdbId - مثال: tt3032476
 * @param {'movie'|'series'} params.type
 * @param {number|null} params.season
 * @param {number|null} params.episode
 * @param {string} params.apiKey
 * @returns {Promise<Array<{id: string, url: string, lang: string}>>}
 */
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
      .filter((sub) => !sub.full_season) // نتجاهل حزم الموسم الكاملة هنا، الحلقة المفردة أدق
      .map((sub, index) => ({
        id: `subdl-${sub.release_name || index}-${index}`,
        // sub.url رابط نسبي مثل /subtitle/xxxx.zip
        url: sub.url.startsWith('http') ? sub.url : `${DOWNLOAD_BASE}${sub.url}`,
        lang: 'ara'
      }));
  } catch (err) {
    console.error('[SubDL] fetch failed:', err.message);
    return [];
  }
}

module.exports = { getSubtitles };
