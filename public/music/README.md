# 音乐文件放这里 / Music files go here

This folder is served as-is by Astro (anything in `public/` is copied
verbatim to the site root, unprocessed) — the correct place for static
audio files, unlike `src/assets/` which is for build-pipeline-optimized
assets like images.

The homepage player card and the navbar mini control both read track
metadata from `src/data/music-tracks.ts`. Currently wired up:

- `track-01.mp3` → 林宛瑜 / Rapeter
- `track-02.mp3` → 虹之间 / 金贵晟

To add more tracks, drop the mp3 file in here and add a matching entry
to the `tracks` array in `src/data/music-tracks.ts`. If a listed file is
ever missing, the player gracefully shows a "暂无音乐" state instead of
erroring — so it's safe to add/remove tracks one at a time.
