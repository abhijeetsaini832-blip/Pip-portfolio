# Pip's Midnight Nursery

A cozy, retro-90s portfolio website for **Pip**, a skull-faced baby who works as a Junior Dream Engineer at the Midnight Nursery. Pip builds the dreams, lullabies and nightlights that help little ghosts and creatures fall asleep.

> "I build the dreams you fall asleep inside."

Built with plain HTML, CSS and JavaScript. No frameworks, no build step.

## Features
- **Pip reacts to you:** Pip leans toward your cursor or finger, and wiggles when poked.
- **Hidden Easter egg:** poke Pip 5 times and Pip falls asleep and a secret lullaby plays. Poke again to wake Pip up.
- **Scroll story:** four illustrated scenes, with a glowing moon travelling along a dream route as you scroll.
- **Lullaby Lab:** a music box you can play by tapping stars (synthesized live with the Web Audio API).
- **Nightlight Collection:** switch on three lamps to light up the big nightlight, then explore a hidden dream layer with a flashlight cursor.
- **Pip's Growth Chart:** Pip's skills as a height chart on the nursery wall.
- **Day / night mode:** changes the sky and the whole colour palette.
- **Retro touches:** sparkle cursor trail, marquee banner, click sounds with a mute button, an odometer-style "Dreams delivered" counter, and a guestbook.
- **Mobile friendly** and respects reduced-motion settings.

## Run locally
Open `index.html` in a browser, or run a simple server in this folder:

```
python3 -m http.server
```

Then visit http://localhost:8000

## Files
- `index.html`: page structure and content
- `style.css`: styling and animations
- `script.js`: sounds, interactions, scroll effects, guestbook
- `*.jpg`: Pip artwork (hero, portrait, music box, lantern)

## Guestbook
By default, wishes are saved in the visitor's own browser. For a shared live guestbook, you can connect a free Supabase project:

1. Run this in the Supabase SQL editor:
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
2. Put your project URL and anon key into `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `script.js`.

## Credits
- **Art:** Pip, the music box and the nightlight lantern are from the official haX.baby "Pip Creator Asset Pack". Story scenes, lamps and stars are hand-coded SVG/CSS.
- **Sound:** synthesized live with the Web Audio API.
- **Fonts:** Fredoka and Press Start 2P (Google Fonts, SIL OFL).
- **Made by:** Abhijeet Saini.
