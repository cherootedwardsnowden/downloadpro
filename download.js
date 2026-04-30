const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { detectPlatform, getYtdlpArgs } = require('./platform');

const uploadsDir = path.join(__dirname, 'uploads');

router.post('/', async (req, res) => {
  const { url, format = 'best', quality = 'best', audioOnly = false, subtitles = false } = req.body;
  const io = req.app.get('io');
  if (!url) return res.status(400).json({ error: 'URL gerekli' });

  const jobId = uuidv4();
  const platform = detectPlatform(url);
  res.json({ jobId, platform, message: 'Indirme baslatildi' });
  io.emit('job:' + jobId, { status: 'starting', message: 'Baslatiliyor...', progress: 0 });

  const outputTemplate = path.join(uploadsDir, jobId + '_%(title)s.%(ext)s');
  const args = getYtdlpArgs({ url, quality, audioOnly, subtitles, outputTemplate });

  const proc = spawn('yt-dlp', args);
  let errorOutput = '';

  proc.stdout.on('data', (data) => {
    const line = data.toString().trim();
    const progressMatch = line.match(/(\d+\.?\d*)%/);
    const speedMatch = line.match(/at\s+([\d.]+\w+\/s)/);
    const etaMatch = line.match(/ETA\s+([\d:]+)/);
    const sizeMatch = line.match(/([\d.]+\w+iB)\s+/);

    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      io.emit('job:' + jobId, {
        status: 'downloading',
        message: 'Indiriliyor...',
        progress,
        speed: speedMatch ? speedMatch[1] : null,
        eta: etaMatch ? etaMatch[1] : null,
        size: sizeMatch ? sizeMatch[1] : null,
        raw: line
      });
    } else if (line.includes('[')) {
      io.emit('job:' + jobId, { status: 'processing', message: line, progress: -1 });
    }
  });

  proc.stderr.on('data', (d) => { errorOutput += d.toString(); });

  proc.on('close', (code) => {
    if (code === 0) {
      const files = fs.readdirSync(uploadsDir).filter(f => f.startsWith(jobId));
      if (files.length > 0) {
        const filename = files[0];
        const stats = fs.statSync(path.join(uploadsDir, filename));
        const filesize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
        io.emit('job:' + jobId, {
          status: 'done', message: 'Indirme tamamlandi!', progress: 100,
          filename, downloadUrl: '/uploads/' + filename, filesize
        });
      } else {
        io.emit('job:' + jobId, { status: 'error', message: 'Dosya bulunamadi.', progress: 0 });
      }
    } else {
      let errMsg = 'Indirme basarisiz.';
      if (errorOutput.includes('Private video')) errMsg = 'Bu video ozel/gizli.';
      else if (errorOutput.includes('not available')) errMsg = 'Bu icerik mevcut degil.';
      else if (errorOutput.includes('Unsupported URL')) errMsg = 'Desteklenmeyen URL.';
      else if (errorOutput.includes('Sign in')) errMsg = 'Bu icerik giris gerektiriyor.';
      else if (errorOutput.includes('geo')) errMsg = 'Bolgenizde mevcut degil.';
      io.emit('job:' + jobId, { status: 'error', message: errMsg, progress: 0 });
    }
  });

  proc.on('error', () => {
    io.emit('job:' + jobId, { status: 'error', message: 'yt-dlp bulunamadi.', progress: 0 });
  });
});

router.post('/batch', async (req, res) => {
  const { urls, audioOnly = false } = req.body;
  const io = req.app.get('io');
  if (!urls || !Array.isArray(urls) || urls.length === 0)
    return res.status(400).json({ error: 'URL listesi gerekli' });
  if (urls.length > 10)
    return res.status(400).json({ error: 'Maksimum 10 URL destekleniyor' });

  const batchId = uuidv4();
  res.json({ batchId, count: urls.length, message: 'Toplu indirme baslatildi' });
  io.emit('batch:' + batchId, { status: 'starting', total: urls.length, completed: 0 });

  let completed = 0;
  const results = [];

  for (const url of urls) {
    const jobId = uuidv4();
    const outputTemplate = path.join(uploadsDir, jobId + '_%(title)s.%(ext)s');
    const args = getYtdlpArgs({ url, audioOnly, outputTemplate });

    await new Promise((resolve) => {
      const proc = spawn('yt-dlp', args);
      let done = false;
      let batchErrOutput = '';
      proc.stderr.on('data', (d) => { batchErrOutput += d.toString(); });
      proc.on('close', (code) => {
        if (!done) {
          done = true; completed++;
          const files = fs.readdirSync(uploadsDir).filter(f => f.startsWith(jobId));
          if (code === 0 && files.length > 0) {
            results.push({ url, status: 'ok', downloadUrl: '/uploads/' + files[0], filename: files[0] });
          } else {
            let errMsg = 'Indirme basarisiz';
            if (batchErrOutput.includes('Private video')) errMsg = 'Bu video ozel/gizli.';
            else if (batchErrOutput.includes('not available')) errMsg = 'Bu icerik mevcut degil.';
            else if (batchErrOutput.includes('Unsupported URL')) errMsg = 'Desteklenmeyen URL.';
            else if (batchErrOutput.includes('Sign in')) errMsg = 'Bu icerik giris gerektiriyor.';
            else if (batchErrOutput.includes('geo')) errMsg = 'Bolgenizde mevcut degil.';
            results.push({ url, status: 'error', message: errMsg });
          }
          io.emit('batch:' + batchId, { status: 'progress', total: urls.length, completed, url });
          resolve();
        }
      });
      proc.on('error', () => {
        if (!done) { done = true; completed++; results.push({ url, status: 'error', message: 'yt-dlp bulunamadi' }); resolve(); }
      });
    });
  }

  io.emit('batch:' + batchId, { status: 'done', total: urls.length, completed, results });
});

module.exports = router;
