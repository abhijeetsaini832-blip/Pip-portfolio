# Pip's Midnight Nursery

Portfolio for **Pip**, the skull baby and Junior Dream Engineer, built for haX.baby's *Baby's First Website* hackathon (Track 1).

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## What is inside
- **Required:** who Pip is, 3 projects, scroll story, visitor reactions (eyes follow pointer/touch, pokes, sounds with mute), mobile layout, hidden Easter egg (poke Pip 5 times).
- **Tier 1:** Pip leans toward the cursor/touch, scroll-driven story, day/night toggle that changes Pip's expression and palette.
- **Tier 2:** Lullaby Lab (Web Audio music box), flashlight dream layer, dream route drawn by scroll.
- **Side quests:** sparkle cursor trail, click sounds with mute, hit counter odometer, guestbook.

## Optional live guestbook (Supabase, free)
1. Create a project at supabase.com and run this in the SQL editor:
```sql
create table guestbook (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) <= 20),
  message text not null check (char_length(message) <= 100),
  created_at timestamptz default now()
);
alter table guestbook enable row level security;
create policy "anyone can read" on guestbook for select using (true);
create policy "anyone can add" on guestbook for insert with check (true);
```
2. Put your project URL and anon key into `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top of the guestbook section in `script.js`.

Without these, the guestbook still works but saves wishes only in the visitor's own browser.

## Deploy
- Vercel / Netlify: drag and drop this folder, or import the GitHub repo. No settings needed.
- GitHub Pages: push to a repo, then Settings, Pages, deploy from the main branch.

## Before you submit (deadline 19 Oct 2026, 17:17 IST)
- [x] Name added in the footer of `index.html` (Abhijeet Saini).
- [ ] Commit in small steps so the public GitHub history shows work between 17 and 19 October.
- [x] Official Pip art (hero, portrait, music box, lantern) from the haX.baby asset pack is in `assets/` and credited in the footer.
- [ ] Test on your phone and check the browser console for errors.
- [ ] Submit: live URL, repo link, short story write-up, credits.

## Credits
Pip, music box and lantern: official haX.baby Pip Creator Asset Pack. Other art: hand-coded SVG/CSS. Sounds: Web Audio API. Fonts: Fredoka and Press Start 2P (Google Fonts, SIL OFL). AI assistance: Claude.
