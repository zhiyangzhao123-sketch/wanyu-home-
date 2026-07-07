# Image asset slots

Replace any file below to update the site — no code changes needed. Keep the same filename and format.

| Slot | Path | Aspect ratio | Min size |
|------|------|--------------|----------|
| Hero slide 1 | `hero/hero-01.jpg` | 16∶9 | 1920 × 1080 |
| Hero slide 2 | `hero/hero-02.jpg` | 16∶9 | 1920 × 1080 |
| Hero slide 3 | `hero/hero-03.jpg` | 16∶9 | 1920 × 1080 |
| Hero slide 4 | `hero/hero-04.jpg` | 16∶9 | 1920 × 1080 |
| Hero slide 5 | `hero/hero-05.jpg` | 16∶9 | 1920 × 1080 |
| Profile avatar | `avatar.png` | 1∶1 | 512 × 512 |
| Gallery thumb 1 | `gallery/g-01.jpg` | 1∶1 | 800 × 800 |
| Gallery thumb 2 | `gallery/g-02.jpg` | 1∶1 | 800 × 800 |
| Gallery thumb 3 | `gallery/g-03.jpg` | 1∶1 | 800 × 800 |
| Gallery thumb 4 | `gallery/g-04.jpg` | 1∶1 | 800 × 800 |
| Gallery thumb 5 | `gallery/g-05.jpg` | 1∶1 | 800 × 800 |
| Gallery thumb 6 | `gallery/g-06.jpg` | 1∶1 | 800 × 800 |
| Article cover 1 | `covers/cover-01.jpg` | 8∶5 | 1600 × 1000 |
| Article cover 2 | `covers/cover-02.jpg` | 8∶5 | 1600 × 1000 |
| Article cover 3 | `covers/cover-03.jpg` | 8∶5 | 1600 × 1000 |

## Blog cover mapping

In blog frontmatter, set `cover` to the slot name (without extension):

- `cover-01` → `covers/cover-01.jpg`
- `cover-02` → `covers/cover-02.jpg`
- `cover-03` → `covers/cover-03.jpg`

## Regenerate placeholders

```bash
node scripts/generate-hero-images.mjs
node scripts/generate-avatar.mjs
node scripts/generate-gallery-images.mjs
node scripts/generate-cover-images.mjs
```
