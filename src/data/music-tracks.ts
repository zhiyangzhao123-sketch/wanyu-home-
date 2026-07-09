export interface MusicTrack {
  title: string;
  artist: string;
  /** Path served from public/, e.g. "/music/track-01.mp3". */
  src: string;
}

// Only list tracks that actually have a matching mp3 file in
// public/music/ — the player shows a graceful "暂无音乐" state for
// anything missing, but there's no reason to list placeholders that
// can never play. Add more entries here once more files are dropped in
// (see public/music/README.md for the expected filenames).
export const tracks: MusicTrack[] = [
  { title: "林宛瑜", artist: "Rapeter", src: "/music/track-01.mp3" },
  { title: "虹之间", artist: "金贵晟", src: "/music/track-02.mp3" },
];
