require('dotenv').config();
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

const subdl = require('./providers/subdl');
const subsource = require('./providers/subsource');

const SUBDL_API_KEY = process.env.SUBDL_API_KEY || '';
const SUBSOURCE_API_KEY = process.env.SUBSOURCE_API_KEY || '';
const PORT = process.env.PORT || 7000;

const manifest = {
  id: 'org.arabicsubs.combined',
  version: '1.0.0',
  name: 'ترجمة عربية مجمّعة (SubDL + SubSource)',
  description: 'إضافة ستريميو تجمع ترجمات عربية من SubDL و SubSource في نفس القائمة',
  logo: 'https://i.imgur.com/8Q9j9jZ.png',
  resources: ['subtitles'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: []
};

const builder = new addonBuilder(manifest);

// id يجي بصيغة: tt3032476 للأفلام أو tt3032476:1:6 للمسلسلات (موسم:حلقة)
function parseId(id) {
  const parts = id.split(':');
  const imdbId = parts[0];
  const season = parts[1] ? parseInt(parts[1], 10) : null;
  const episode = parts[2] ? parseInt(parts[2], 10) : null;
  return { imdbId, season, episode };
}

builder.defineSubtitlesHandler(async ({ type, id }) => {
  const { imdbId, season, episode } = parseId(id);

  console.log(`[subtitles] طلب ترجمة لـ ${type} - ${imdbId} S${season || '-'}E${episode || '-'}`);

  const [subdlResults, subsourceResults] = await Promise.all([
    subdl.getSubtitles({ imdbId, type, season, episode, apiKey: SUBDL_API_KEY }),
    subsource.getSubtitles({ imdbId, type, season, episode, apiKey: SUBSOURCE_API_KEY })
  ]);

  const combined = [...subdlResults, ...subsourceResults];

  console.log(`[subtitles] رجع ${subdlResults.length} من SubDL و ${subsourceResults.length} من SubSource`);

  return { subtitles: combined };
});

serveHTTP(builder.getInterface(), { port: PORT, host: '0.0.0.0' });

console.log(`✅ الإضافة تشتغل على المنفذ ${PORT}`);
console.log(`   - من نفس الكمبيوتر: http://127.0.0.1:${PORT}/manifest.json`);
console.log('   - من الجوال (نفس شبكة الواي فاي): استخدم IP الشبكة المحلي للكمبيوتر بدل 127.0.0.1');
console.log('     مثال: http://192.168.1.15:7000/manifest.json');
console.log('     شوف رقم الـ IP عن طريق ipconfig (ويندوز) أو ifconfig (ماك/لينكس)');

if (!SUBDL_API_KEY) console.warn('⚠️  ما حطيت SUBDL_API_KEY في ملف .env - ترجمات SubDL بتكون فارغة.');
if (!SUBSOURCE_API_KEY) console.warn('⚠️  ما حطيت SUBSOURCE_API_KEY في ملف .env - ترجمات SubSource بتكون فارغة.');
