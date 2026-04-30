const fs = require('fs');
const path = require('path');

function cleanupOldFiles(dir, maxAgeMs = 2 * 60 * 60 * 1000) {
  try {
    const files = fs.readdirSync(dir);
    const now = Date.now();
    let deleted = 0;
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) { fs.unlinkSync(filePath); deleted++; }
      } catch (e) {}
    }
    if (deleted > 0) console.log('[Cleanup] Deleted ' + deleted + ' old files');
  } catch (e) {
    console.error('[Cleanup] Error:', e.message);
  }
}

module.exports = { cleanupOldFiles };
