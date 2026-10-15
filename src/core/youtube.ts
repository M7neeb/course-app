const ID = /^[A-Za-z0-9_-]{11}$/;

/** Pulls the 11-character video id out of the common YouTube link shapes. */
export function extractYouTubeId(input: string): string | null {
  const text = input.trim();
  if (ID.test(text)) return text;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? '';
    return ID.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v');
    if (v && ID.test(v)) return v;
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m && m[1]) return m[1];
  }
  return null;
}

/** Kept for old links in saved data; the app no longer shows search terms. */
export function youtubeSearchUrl(term: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbedUrl(id: string, autoplay: boolean): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`;
}

/** The video id behind a block's `url` (or a saved link), or null when it is not a YouTube video. */
export function videoIdOf(url: unknown): string | null {
  return typeof url === 'string' && url.trim() !== '' ? extractYouTubeId(url) : null;
}

/** The medium thumbnail. YouTube answers unknown ids with a 120 x 90 placeholder instead. */
export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}
