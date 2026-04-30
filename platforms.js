const PLATFORMS_CLIENT = {
  youtube:     { name: 'YouTube',     icon: '▶', color: '#FF0000', category: 'normal',  patterns: ['youtube.com', 'youtu.be'] },
  instagram:   { name: 'Instagram',   icon: '📷', color: '#E1306C', category: 'normal',  patterns: ['instagram.com'] },
  tiktok:      { name: 'TikTok',      icon: '🎵', color: '#010101', category: 'normal',  patterns: ['tiktok.com', 'vm.tiktok.com'] },
  twitter:     { name: 'Twitter/X',   icon: '𝕏',  color: '#1DA1F2', category: 'normal',  patterns: ['twitter.com', 'x.com'] },
  facebook:    { name: 'Facebook',    icon: '📘', color: '#1877F2', category: 'normal',  patterns: ['facebook.com', 'fb.watch'] },
  reddit:      { name: 'Reddit',      icon: '🤖', color: '#FF4500', category: 'normal',  patterns: ['reddit.com', 'v.redd.it'] },
  twitch:      { name: 'Twitch',      icon: '🎮', color: '#9146FF', category: 'normal',  patterns: ['twitch.tv'] },
  vimeo:       { name: 'Vimeo',       icon: '🎬', color: '#1AB7EA', category: 'normal',  patterns: ['vimeo.com'] },
  dailymotion: { name: 'Dailymotion', icon: '📺', color: '#0066DC', category: 'normal',  patterns: ['dailymotion.com', 'dai.ly'] },
  soundcloud:  { name: 'SoundCloud',  icon: '🎧', color: '#FF5500', category: 'normal',  patterns: ['soundcloud.com'] },
  spotify:     { name: 'Spotify',     icon: '🎵', color: '#1DB954', category: 'normal',  patterns: ['spotify.com'] },
  bilibili:    { name: 'Bilibili',    icon: '📺', color: '#00A1D6', category: 'normal',  patterns: ['bilibili.com'] },
  pinterest:   { name: 'Pinterest',   icon: '📌', color: '#E60023', category: 'normal',  patterns: ['pinterest.com'] },
  linkedin:    { name: 'LinkedIn',    icon: '💼', color: '#0A66C2', category: 'normal',  patterns: ['linkedin.com'] },
  rumble:      { name: 'Rumble',      icon: '📹', color: '#85C742', category: 'normal',  patterns: ['rumble.com'] },
  odysee:      { name: 'Odysee',      icon: '🌊', color: '#EF1970', category: 'normal',  patterns: ['odysee.com'] },
  snapchat:    { name: 'Snapchat',    icon: '👻', color: '#FFFC00', category: 'normal',  patterns: ['snapchat.com'] },
  niconico:    { name: 'Niconico',    icon: '⛩',  color: '#ffffff', category: 'normal',  patterns: ['nicovideo.jp'] },
  pornhub:     { name: 'Pornhub',     icon: '🔞', color: '#FFA500', category: 'nsfw',    patterns: ['pornhub.com'] },
  xvideos:     { name: 'XVideos',     icon: '🔞', color: '#1a1a1a', category: 'nsfw',    patterns: ['xvideos.com'] },
  xhamster:    { name: 'xHamster',    icon: '🔞', color: '#f60',    category: 'nsfw',    patterns: ['xhamster.com'] },
  redtube:     { name: 'RedTube',     icon: '🔞', color: '#cc0000', category: 'nsfw',    patterns: ['redtube.com'] },
  youporn:     { name: 'YouPorn',     icon: '🔞', color: '#1a1a1a', category: 'nsfw',    patterns: ['youporn.com'] },
  spankbang:   { name: 'SpankBang',   icon: '🔞', color: '#e6473a', category: 'nsfw',    patterns: ['spankbang.com'] },
};

function detectPlatformClient(url) {
  if (!url) return null;
  const lower = url.toLowerCase();
  for (const [key, p] of Object.entries(PLATFORMS_CLIENT)) {
    if (p.patterns.some(pat => lower.includes(pat))) {
      return { key, ...p };
    }
  }
  return null;
}
