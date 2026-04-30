# VAULTDL — Universal Media Downloader

1000+ site destekli, kayıt gerektirmeyen medya indirici. yt-dlp + ffmpeg tabanlı.

## Özellikler

- ✅ YouTube, Instagram, TikTok, Twitter/X, Facebook, Reddit, Twitch, ve 1000+ site
- ✅ NSFW site desteği (Pornhub, XVideos, vb.)
- ✅ Gerçek zamanlı indirme ilerlemesi (Socket.io)
- ✅ Video kalite seçimi (4K, 1080p, 720p, 480p, 360p)
- ✅ Ses indirme (MP3)
- ✅ Altyazı desteği
- ✅ Toplu indirme (max 10 URL)
- ✅ Video bilgisi önizleme
- ✅ İndirme geçmişi
- ✅ Otomatik dosya temizleme (2 saat)
- ✅ Rate limiting
- ✅ Burger menü ile kategori navigasyonu

## Railway'de Kurulum

1. Bu repoyu fork edin veya Railway'e yükleyin
2. Railway yeni proje → Deploy from GitHub
3. Dockerfile otomatik algılanır
4. PORT env değişkeni Railway tarafından otomatik ayarlanır
5. Deploy!

## Lokal Kurulum

```bash
# Gereksinimler: Node.js 18+, yt-dlp, ffmpeg

# yt-dlp kurulumu
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

# ffmpeg
apt install ffmpeg  # Ubuntu/Debian
brew install ffmpeg # macOS

# Proje
npm install
cp .env.example .env
node server.js
```

## API Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| POST | /api/download | Tekil indirme |
| POST | /api/download/batch | Toplu indirme |
| POST | /api/info | Video bilgisi |
| GET | /health | Sağlık kontrolü |

## Teknolojiler

- **Backend**: Node.js + Express
- **Realtime**: Socket.io
- **Downloader**: yt-dlp + ffmpeg
- **Frontend**: Vanilla JS + CSS

## Notlar

- İndirilen dosyalar 2 saat sonra otomatik silinir
- Maksimum 50 istek / 15 dakika (rate limiting)
- Telif hakkıyla korunan içerik indirilirken dikkatli olun
