# Vault Arcade

A 4-stage browser game. Clear stages 1–3 to lock in the three pieces of a
vault door; clear stage 4 (Breakout) to reveal a key. Drag the key onto the
door to reveal the final code.

- **Stage 1 — Frequency Recall**: 5 rounds, must score above 8.5 every round.
- **Stage 2 — Quoridor Duel**: race an easy bot across a 9x9 board.
- **Stage 3 — The Chess Table**: beat a deliberately weak (~200 elo) bot.
- **Stage 4 — Breakout Vault**: clear the brick wall to reveal the key underneath.

Shared 3-heart system across all stages. Lose a stage → lose a heart. Lose
all 3 hearts → sent back to the previous stage (hearts refill to 3).

Passcode to enter the site: **Ilovestink**

---

## How to put this online permanently (free, no coding required)

This is a static site (just HTML/CSS/JS) — no server needed. The easiest
free, permanent host is **GitHub Pages**.

1. Go to **github.com** and make a free account if you don't have one.
2. Click the **+** in the top right → **New repository**. Name it something
   like `vault-arcade`. Keep it **Public** (required for free GitHub Pages).
   Click **Create repository**.
3. On the new repo page, click **Add file → Upload files**.
4. Drag in every file and folder from this project
   (`index.html`, the `css` folder, and the `js` folder), keeping the same
   folder structure. Click **Commit changes**.
5. Go to the repo's **Settings** tab → **Pages** (left sidebar).
6. Under "Build and deployment", set **Source: Deploy from a branch**,
   **Branch: main**, folder **/(root)**. Click **Save**.
7. Wait about a minute, then refresh — GitHub will show you a URL like
   `https://yourusername.github.io/vault-arcade/`. That link works forever,
   on any phone, tablet, or computer, for free.

## A couple of honest notes

- **The passcode is a friendly lock, not a vault-grade one.** Since this is
  a plain static site with no backend server, anyone who opened the page's
  source code could technically find a way past it. It'll comfortably keep
  out casual visitors, which is what a project like this needs — just don't
  rely on it for anything truly sensitive.
- **Progress (hearts, cleared stages) is saved in your browser**, not
  synced across devices. If you play on your phone and then open the same
  link on a laptop, the laptop starts fresh. The link itself works
  everywhere; the save file is per-browser.
- To change the passcode later, open `js/state.js` and edit the line near
  the top: `const PASSCODE = "Ilovestink";`
