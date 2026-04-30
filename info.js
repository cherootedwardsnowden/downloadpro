const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const { detectPlatform } = require('./platform');

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL gerekli' });

  const platform = detectPlatform(url);
  const args = ['--dump-json', '--no-playlist', '--no-warnings', '--socket-timeout', '10', url];

  let output = '';
  let errorOutput = '';
  const proc = spawn('yt-dlp', args);

  proc.stdout.on('data', (d) => { output += d.toString(); });
  proc.stderr.on('data', (d) => { errorOutput += d.toString(); });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill();
    if (!res.headersSent) res.status(408).json({ error: 'Zaman asimi (10s)' });
  }, 15000);

  proc.on('close', (code) => {
    clearTimeout(timer);
    if (timedOut) return;
    if (code === 0 && output) {
      try {
        const lines = output.trim().split('\n').filter(Boolean);
        const info = JSON.parse(lines[0]);
        const formats = (info.formats || []).map(f => ({
          format_id: f.format_id, ext: f.ext,
          resolution: f.resolution || (f.height ? f.height + 'p' : 'audio'),
          fps: f.fps,
          filesize: f.filesize ? Math.round(f.filesize / 1024 / 1024 * 10) / 10 : null,
          vcodec: f.vcodec, acodec: f.acodec, note: f.format_note
        })).filter(f => f.ext !== 'mhtml');

        res.json({
          title: info.title, thumbnail: info.thumbnail, duration: info.duration,
          uploader: info.uploader, view_count: info.view_count, like_count: info.like_count,
          description: info.description ? info.description.slice(0, 500) : null,
          platform, url, formats: formats.slice(-20), is_live: info.is_live, age_limit: info.age_limit
        });
      } catch (e) {
        res.status(500).json({ error: 'JSON parse hatasi', detail: e.message });
      }
    } else {
      let errMsg = 'Bilgi alinamadi.';
      if (errorOutput.includes('Private')) errMsg = 'Ozel icerik.';
      else if (errorOutput.includes('Unsupported URL')) errMsg = 'Desteklenmeyen URL.';
      else if (errorOutput.includes('not available')) errMsg = 'Mevcut degil.';
      res.status(400).json({ error: errMsg });
    }
  });

  proc.on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'yt-dlp yuklu degil' });
  });
});

module.exports = router;
