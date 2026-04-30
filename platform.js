const PLATFORMS = {
  youtube:     { name: 'YouTube',     icon: '▶', color: '#FF0000', patterns: ['youtube.com', 'youtu.be'], category: 'normal' },
  instagram:   { name: 'Instagram',   icon: '📷', color: '#E1306C', patterns: ['instagram.com'], category: 'normal' },
  tiktok:      { name: 'TikTok',      icon: '🎵', color: '#010101', patterns: ['tiktok.com', 'vm.tiktok.com'], category: 'normal' },
  twitter:     { name: 'Twitter/X',   icon: '𝕏',  color: '#1DA1F2', patterns: ['twitter.com', 'x.com'], category: 'normal' },
  facebook:    { name: 'Facebook',    icon: '📘', color: '#1877F2', patterns: ['facebook.com', 'fb.watch'], category: 'normal' },
  reddit:      { name: 'Reddit',      icon: '🤖', color: '#FF4500', patterns: ['reddit.com', 'v.redd.it'], category: 'normal' },
  twitch:      { name: 'Twitch',      icon: '🎮', color: '#9146FF', patterns: ['twitch.tv'], category: 'normal' },
  vimeo:       { name: 'Vimeo',       icon: '🎬', color: '#1AB7EA', patterns: ['vimeo.com'], category: 'normal' },
  dailymotion: { name: 'Dailymotion', icon: '📺', color: '#0066DC', patterns: ['dailymotion.com', 'dai.ly'], category: 'normal' },
  soundcloud:  { name: 'SoundCloud',  icon: '🎧', color: '#FF5500', patterns: ['soundcloud.com'], category: 'normal' },
  spotify:     { name: 'Spotify',     icon: '🎵', color: '#1DB954', patterns: ['spotify.com'], category: 'normal' },
  bilibili:    { name: 'Bilibili',    icon: '📺', color: '#00A1D6', patterns: ['bilibili.com'], category: 'normal' },
  pinterest:   { name: 'Pinterest',   icon: '📌', color: '#E60023', patterns: ['pinterest.com'], category: 'normal' },
  linkedin:    { name: 'LinkedIn',    icon: '💼', color: '#0A66C2', patterns: ['linkedin.com'], category: 'normal' },
  rumble:      { name: 'Rumble',      icon: '📹', color: '#85C742', patterns: ['rumble.com'], category: 'normal' },
  odysee:      { name: 'Odysee',      icon: '🌊', color: '#EF1970', patterns: ['odysee.com'], category: 'normal' },
  snapchat:    { name: 'Snapchat',    icon: '👻', color: '#FFFC00', patterns: ['snapchat.com'], category: 'normal' },
  niconico:    { name: 'Niconico',    icon: '⛩',  color: '#ffffff', patterns: ['nicovideo.jp'], category: 'normal' },
  pornhub:     { name: 'Pornhub',     icon: '🔞', color: '#FFA500', patterns: ['pornhub.com'], category: 'nsfw' },
  xvideos:     { name: 'XVideos',     icon: '🔞', color: '#1a1a1a', patterns: ['xvideos.com'], category: 'nsfw' },
  xhamster:    { name: 'xHamster',    icon: '🔞', color: '#f60',    patterns: ['xhamster.com'], category: 'nsfw' },
  redtube:     { name: 'RedTube',     icon: '🔞', color: '#cc0000', patterns: ['redtube.com'], category: 'nsfw' },
  youporn:     { name: 'YouPorn',     icon: '🔞', color: '#1a1a1a', patterns: ['youporn.com'], category: 'nsfw' },
  spankbang:   { name: 'SpankBang',   icon: '🔞', color: '#e6473a', patterns: ['spankbang.com'], category: 'nsfw' },
};

function detectPlatform(url) {
  try {
    const lower = url.toLowerCase();
    for (const [key, p] of Object.entries(PLATFORMS)) {
      if (p.patterns.some(pat => lower.includes(pat))) return { key, ...p };
    }
    return { key: 'generic', name: 'Generic', icon: '🌐', color: '#888', category: 'normal' };
  } catch { return { key: 'generic', name: 'Generic', icon: '🌐', color: '#888', category: 'normal' }; }
}

function getYtdlpArgs({ url, quality = 'best', audioOnly = false, subtitles = false, outputTemplate }) {
  const args = ['-o', outputTemplate, '--no-playlist'];
  if (audioOnly) {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    if (quality === 'best') args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best');
    else if (quality === '1080p') args.push('-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]/best');
    else if (quality === '720p')  args.push('-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best');
    else if (quality === '480p')  args.push('-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]/best');
    else if (quality === '360p')  args.push('-f', 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360]/best');
    else args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best');
    args.push('--merge-output-format', 'mp4');
  }
  if (subtitles) args.push('--write-subs', '--sub-langs', 'tr,en', '--embed-subs');
  args.push('--add-metadata', '--embed-thumbnail', '--retries', '3', '--fragment-retries', '3', '--socket-timeout', '30', '--no-warnings', '--progress');
  args.push(url);
  return args;
}

module.exports = { detectPlatform, getYtdlpArgs, PLATFORMS };
