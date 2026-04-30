/* ===== VAULTDL APP.JS ===== */
'use strict';

const socket = io();
let currentJobId = null;
let lastUrl = '';
const downloadHistory = JSON.parse(localStorage.getItem('dlHistory') || '[]');

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const sidebar        = $('sidebar');
const sidebarOverlay = $('sidebarOverlay');
const burgerBtn      = $('burgerBtn');
const sidebarClose   = $('sidebarClose');
const urlInput       = $('urlInput');
const pasteBtn       = $('pasteBtn');
const urlIcon        = $('urlIcon');
const platformDetected = $('platformDetected');
const platformBadge  = $('platformBadge');
const platformName   = $('platformName');
const categoryBadge  = $('categoryBadge');
const qualitySelect  = $('qualitySelect');
const formatSelect   = $('formatSelect');
const subtitlesCheck = $('subtitlesCheck');
const infoBtn        = $('infoBtn');
const downloadBtn    = $('downloadBtn');
const infoPanel      = $('infoPanel');
const progressCard   = $('progressCard');
const resultCard     = $('resultCard');
const errorCard      = $('errorCard');
const progressBar    = $('progressBar');
const progressIndeterminate = $('progressIndeterminate');
const progressStatus = $('progressStatus');
const progressPlatform = $('progressPlatform');
const progressSpeed  = $('progressSpeed');
const progressEta    = $('progressEta');
const progressSize   = $('progressSize');
const progressPercent= $('progressPercent');
const progressLog    = $('progressLog');
const resultDownloadBtn = $('resultDownloadBtn');
const resultFilename = $('resultFilename');
const resultFilesize = $('resultFilesize');
const errorMsg       = $('errorMsg');
const retryBtn       = $('retryBtn');
const newDownloadBtn = $('newDownloadBtn');
const statusPill     = $('statusPill');

// ===== SIDEBAR =====
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
  document.body.style.overflow = '';
}
burgerBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const view = item.dataset.view;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`view-${view}`).classList.add('active');
    closeSidebar();
    if (view === 'history') renderHistory();
  });
});

// ===== PLATFORM GRID IN SIDEBAR =====
function buildPlatformGrid() {
  const grid = $('platformGrid');
  Object.entries(PLATFORMS_CLIENT).forEach(([key, p]) => {
    const chip = document.createElement('div');
    chip.className = 'platform-chip';
    chip.innerHTML = `<span>${p.icon}</span><span>${p.name}</span>`;
    chip.title = p.name;
    grid.appendChild(chip);
  });
}
buildPlatformGrid();

// ===== SHOWCASE TABS =====
function buildShowcase() {
  const normalGrid = $('tab-normal');
  const nsfwGrid   = $('tab-nsfw');
  Object.entries(PLATFORMS_CLIENT).forEach(([key, p]) => {
    const card = document.createElement('div');
    card.className = 'platform-card';
    card.innerHTML = `<div class="p-icon">${p.icon}</div><div class="p-name">${p.name}</div>`;
    (p.category === 'nsfw' ? nsfwGrid : normalGrid).appendChild(card);
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}
buildShowcase();

// ===== URL INPUT DETECTION =====
urlInput.addEventListener('input', () => {
  const url = urlInput.value.trim();
  if (!url) {
    platformDetected.style.display = 'none';
    urlIcon.textContent = '🔗';
    return;
  }
  const p = detectPlatformClient(url);
  if (p) {
    platformDetected.style.display = 'flex';
    platformBadge.textContent = p.icon;
    platformName.textContent = p.name;
    categoryBadge.textContent = p.category === 'nsfw' ? 'NSFW 🔞' : 'Normal';
    categoryBadge.className = `cat-badge ${p.category}`;
    urlIcon.textContent = p.icon;
  } else {
    platformDetected.style.display = 'none';
    urlIcon.textContent = '🔗';
  }
});

// Paste button
pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    urlInput.value = text;
    urlInput.dispatchEvent(new Event('input'));
    toast('Panodan yapıştırıldı', 'success');
  } catch {
    toast('Pano erişimi reddedildi', 'error');
  }
});

// ===== INFO FETCH =====
infoBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) { toast('URL girin', 'error'); return; }

  infoBtn.disabled = true;
  infoBtn.textContent = '⏳ Yükleniyor...';
  hideAll();

  try {
    const res = await fetch('/api/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();

    if (!res.ok) {
      toast(data.error || 'Bilgi alınamadı', 'error');
      return;
    }

    // Populate info panel
    $('infoThumb').src = data.thumbnail || '';
    $('infoTitle').textContent = data.title || 'Başlıksız';
    $('infoDuration').textContent = data.duration ? `⏱ ${formatDuration(data.duration)}` : '';
    $('infoUploader').textContent = data.uploader ? `👤 ${data.uploader}` : '';
    $('infoViews').textContent = data.view_count ? `👁 ${formatNum(data.view_count)}` : '';
    $('infoDesc').textContent = data.description || '';

    const fList = $('formatsList');
    fList.innerHTML = '';
    if (data.formats && data.formats.length) {
      data.formats.slice(-15).reverse().forEach(f => {
        const chip = document.createElement('div');
        chip.className = 'format-chip';
        chip.textContent = `${f.resolution || f.ext}${f.fps ? '@'+f.fps+'fps' : ''}${f.filesize ? ' · '+f.filesize+'MB' : ''}`;
        chip.title = `Format: ${f.format_id} | Codec: ${f.vcodec || 'N/A'} + ${f.acodec || 'N/A'}`;
        fList.appendChild(chip);
      });
    }

    infoPanel.style.display = 'block';
    toast('Video bilgisi alındı', 'success');
  } catch (e) {
    toast('Bağlantı hatası', 'error');
  } finally {
    infoBtn.disabled = false;
    infoBtn.textContent = '🔍 Bilgi Al';
  }
});

// ===== DOWNLOAD =====
downloadBtn.addEventListener('click', startDownload);

async function startDownload() {
  const url = urlInput.value.trim();
  if (!url) { toast('URL girin', 'error'); return; }

  const audioOnly = formatSelect.value === 'audio';
  const quality = audioOnly ? 'best' : qualitySelect.value;
  const subtitles = subtitlesCheck.checked;
  const platform = detectPlatformClient(url);

  hideAll();
  progressCard.style.display = 'block';
  downloadBtn.disabled = true;
  downloadBtn.textContent = '⏳ Başlatılıyor...';
  progressPlatform.textContent = platform ? `${platform.icon} ${platform.name}` : '🌐 Generic';
  progressStatus.textContent = 'Başlatılıyor...';
  progressBar.style.width = '0%';
  progressLog.textContent = '';
  progressIndeterminate.classList.add('show');
  progressBar.style.width = '0%';

  lastUrl = url;

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format: 'best', quality, audioOnly, subtitles })
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Sunucu hatası');
      return;
    }

    currentJobId = data.jobId;
    listenToJob(currentJobId);

  } catch (e) {
    showError('Bağlantı kurulamadı');
    downloadBtn.disabled = false;
    downloadBtn.textContent = '⬇ İndir';
  }
}

function listenToJob(jobId) {
  socket.on(`job:${jobId}`, (data) => {
    console.log('Job event:', data);

    if (data.status === 'starting') {
      progressStatus.textContent = 'Başlatılıyor...';
      progressIndeterminate.classList.add('show');
    }

    else if (data.status === 'downloading') {
      progressIndeterminate.classList.remove('show');
      if (data.progress >= 0) {
        progressBar.style.width = data.progress + '%';
        progressPercent.textContent = data.progress.toFixed(1) + '%';
      }
      progressStatus.textContent = 'İndiriliyor...';
      if (data.speed) progressSpeed.textContent = '⚡ ' + data.speed;
      if (data.eta) progressEta.textContent = '⏱ ' + data.eta;
      if (data.size) progressSize.textContent = '📦 ' + data.size;
      if (data.raw) progressLog.textContent = data.raw;
    }

    else if (data.status === 'processing') {
      progressIndeterminate.classList.add('show');
      progressStatus.textContent = 'İşleniyor...';
      if (data.message) progressLog.textContent = data.message;
    }

    else if (data.status === 'done') {
      socket.off(`job:${jobId}`);
      progressCard.style.display = 'none';
      showResult(data);
      downloadBtn.disabled = false;
      downloadBtn.textContent = '⬇ İndir';
      // Add to history
      addToHistory({
        filename: data.filename,
        downloadUrl: data.downloadUrl,
        filesize: data.filesize,
        url: lastUrl,
        platform: detectPlatformClient(lastUrl),
        time: new Date().toLocaleString('tr-TR')
      });
    }

    else if (data.status === 'error') {
      socket.off(`job:${jobId}`);
      progressCard.style.display = 'none';
      showError(data.message);
      downloadBtn.disabled = false;
      downloadBtn.textContent = '⬇ İndir';
    }
  });
}

function showResult(data) {
  resultCard.style.display = 'flex';
  resultFilename.textContent = data.filename || 'Dosya';
  resultFilesize.textContent = data.filesize || '';
  resultDownloadBtn.href = data.downloadUrl;
  resultDownloadBtn.download = data.filename;
  toast('İndirme tamamlandı! 🎉', 'success');
}

function showError(msg) {
  errorCard.style.display = 'flex';
  errorMsg.textContent = msg;
  toast(msg, 'error');
}

function hideAll() {
  infoPanel.style.display = 'none';
  progressCard.style.display = 'none';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
}

// ===== RETRY / NEW =====
retryBtn.addEventListener('click', () => {
  errorCard.style.display = 'none';
  startDownload();
});

newDownloadBtn.addEventListener('click', () => {
  resultCard.style.display = 'none';
  urlInput.value = '';
  urlInput.dispatchEvent(new Event('input'));
  urlInput.focus();
});

// ===== BATCH =====
$('batchDownloadBtn').addEventListener('click', async () => {
  const raw = $('batchUrls').value.trim();
  if (!raw) { toast('URL girin', 'error'); return; }

  const urls = raw.split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http'));
  if (urls.length === 0) { toast('Geçerli URL bulunamadı', 'error'); return; }
  if (urls.length > 10) { toast('Maksimum 10 URL', 'error'); return; }

  const audioOnly = $('batchFormat').value === 'audio';
  const btn = $('batchDownloadBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Başlatılıyor...';

  $('batchProgress').style.display = 'block';
  $('batchTotal').textContent = urls.length;
  $('batchCompleted').textContent = '0';
  $('batchItems').innerHTML = '';
  $('batchResults').innerHTML = '';

  // Create items
  urls.forEach((url, i) => {
    const item = document.createElement('div');
    item.className = 'batch-item';
    item.id = `batchItem_${i}`;
    const p = detectPlatformClient(url);
    item.innerHTML = `<span>${p ? p.icon : '🌐'}</span><span class="batch-item-url">${url}</span><span class="batch-item-status" id="batchStatus_${i}">⏳</span>`;
    $('batchItems').appendChild(item);
  });

  try {
    const res = await fetch('/api/download/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, audioOnly })
    });
    const data = await res.json();

    if (!res.ok) {
      toast(data.error || 'Hata', 'error');
      btn.disabled = false;
      btn.textContent = '⬇ Hepsini İndir';
      return;
    }

    const batchId = data.batchId;

    socket.on(`batch:${batchId}`, (ev) => {
      if (ev.status === 'progress') {
        $('batchCompleted').textContent = ev.completed;
        // Update the specific item
        const idx = urls.indexOf(ev.url);
        if (idx >= 0) {
          const s = $(`batchStatus_${idx}`);
          if (s) s.textContent = '✅';
        }
      } else if (ev.status === 'done') {
        socket.off(`batch:${batchId}`);
        btn.disabled = false;
        btn.textContent = '⬇ Hepsini İndir';
        toast(`${ev.completed}/${ev.total} indirme tamamlandı`, 'success');

        // Show results
        ev.results.forEach(r => {
          const div = document.createElement('div');
          div.className = 'batch-result-item';
          if (r.status === 'ok') {
            div.innerHTML = `✅ <a href="${r.downloadUrl}" download="${r.filename}">${r.filename}</a>`;
            addToHistory({ filename: r.filename, downloadUrl: r.downloadUrl, url: r.url, platform: detectPlatformClient(r.url), time: new Date().toLocaleString('tr-TR') });
          } else {
            div.innerHTML = `❌ <span style="color:var(--text3)">${r.url} — ${r.message}</span>`;
          }
          $('batchResults').appendChild(div);
        });
      }
    });
  } catch (e) {
    toast('Bağlantı hatası', 'error');
    btn.disabled = false;
    btn.textContent = '⬇ Hepsini İndir';
  }
});

// ===== HISTORY =====
function addToHistory(item) {
  downloadHistory.unshift(item);
  if (downloadHistory.length > 50) downloadHistory.pop();
  localStorage.setItem('dlHistory', JSON.stringify(downloadHistory));
}

function renderHistory() {
  const list = $('historyList');
  const clearBtn = $('clearHistoryBtn');
  list.innerHTML = '';

  if (downloadHistory.length === 0) {
    list.innerHTML = '<div class="empty-state">Henüz indirme yok.</div>';
    clearBtn.style.display = 'none';
    return;
  }

  clearBtn.style.display = 'inline-block';
  downloadHistory.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <span class="history-item-icon">${item.platform ? item.platform.icon : '🌐'}</span>
      <div class="history-item-info">
        <div class="history-item-filename">${item.filename || 'Bilinmiyor'}</div>
        <div class="history-item-meta">${item.time} ${item.filesize ? '· '+item.filesize : ''}</div>
      </div>
      <a class="history-item-dl" href="${item.downloadUrl}" download="${item.filename}">⬇</a>
    `;
    list.appendChild(div);
  });
}

$('clearHistoryBtn').addEventListener('click', () => {
  downloadHistory.length = 0;
  localStorage.setItem('dlHistory', JSON.stringify(downloadHistory));
  renderHistory();
  toast('Geçmiş temizlendi', 'info');
});

// ===== SOCKET STATUS =====
socket.on('connect', () => {
  statusPill.textContent = '🟢 Online';
  statusPill.style.color = '';
});
socket.on('disconnect', () => {
  statusPill.textContent = '🔴 Offline';
});

// ===== UTILS =====
function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function formatNum(n) {
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n;
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  const container = $('toastContainer');
  const div = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => {
    div.classList.add('out');
    div.addEventListener('animationend', () => div.remove());
  }, 3500);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement === urlInput) return;
  if (e.key === 'Enter' && document.activeElement === urlInput) {
    e.preventDefault();
    startDownload();
  }
  if (e.key === 'Escape') closeSidebar();
});

// Init
renderHistory();
toast('VAULTDL hazır 🚀', 'info');
