# Exploration & Incidental Knowledge

A design spec for turning the library into a playground for the mind — the kind where you sit down to look something up and stand up an hour later having learned six adjacent things you didn't plan to.

The model is the encyclopedia. Old encyclopedias rewarded wandering: the index drew you to one entry, but the cross-references and the marginalia and the illustration of something unrelated on the opposite page pulled you sideways. Wikipedia compresses this into the rabbit hole. This library is trying to build it back in physical, navigable form — a starmap you read with your eyes rather than your queries.

---

## Mechanics — Shipped

### Galaxy as ambient browse
Stars carry their topic names as projected labels. Slow idle rotation when you sit still. Hover for tooltip, click to enter. The galaxy is the index; the act of looking around IS browsing.

### Hover dwell tooltip
Already in place — name + cluster + document count. The marginalia of the starmap.

### "Did you know" cards (shipped this commit)
After ~30 seconds of idle galaxy viewing, a small card surfaces in the bottom-left with a short surprising fact drawn from a random topic's research findings. Three buttons:
- **another** — cycles to a different fact (different topic too)
- **→ visit** — warps to that topic
- **✕** — dismiss

Facts are pulled live from each topic's `conclusionBody.ul.items` and `documents.findings` arrays. The same fact won't repeat in a session until the pool is exhausted.

Rhythm: surfaces every 45-90 seconds during idle galaxy time. Auto-dismisses after 22 seconds if no interaction. Suppressed entirely when you're inside a planet or actively dragging.

### Tags as bridges
Tags at the bottom of every planet/moon panel are clickable. Each click either warps to a matching topic or generates a new entry. Every tag is a potential rabbit hole.

### Cannonball collisions
Smash two topics together to generate a poetic synthesis as a new star. The graph grows from your curiosity.

### Connections panel + manual add
Every star shows its galactic neighbors. A `+ add connection` button at the bottom lets you forge new edges between any two stars.

---

## Mechanics — Proposed (in priority order)

### 1. Tangent buttons in the document reader
At the bottom of every document, a row of "tangents" — three pre-computed adjacent ideas. Click any tangent and you're warped to that topic. Tangents are drawn from:
- The topic's own connections graph
- Tag overlap with other topics
- The Librarian's previous answers about this topic

Implementation: ~80 LOC. Adds one row of pills under doc-prose. The chosen tangent surfaces with the same poetic copy ("a tangent: …") so it feels intentional.

### 2. Visit trails (constellation memory)
Stars and moons you've visited get a faint persistent ring around them. Edges you've traversed (clicked through, or whose connection panel you've explored) get a slightly brighter line. The galaxy gradually reveals your path through it — a chart of where your curiosity went.

Implementation: ~120 LOC. localStorage `motu.visitTrail` = `{ topicId: timestamp }`. Edge-trail tracked similarly. Rendered as subtle extra geometry.

### 3. The Index (encyclopedia-style alphabetical list)
A toggleable side panel (or modal) listing every topic, moon, insight, and tag alphabetically. Click any entry to warp. Filter by cluster or by visited/unvisited.

Implementation: ~150 LOC. Pure HTML/CSS list + search input. Very low risk.

### 4. Daily First Read
On first page load each day, a "Today the Librarian commends to you…" card surfaces with a recommended starting topic — preferring topics you haven't visited yet. Sets a daily seed so the same suggestion stays consistent across the day.

Implementation: ~60 LOC. localStorage `motu.lastVisitDate` + a deterministic-per-day pick.

### 5. Constellation patterns (latent unlocks)
When you've visited 3+ stars that form a known thematic cluster, the system unlocks a generated "constellation" entry — a synthesis spanning all of them. Examples:
- Consciousness + Memory + Time = "the substrates of self"
- Mathematics + Music + Mythology = "structure as transmission"
- Plasma Dynamics + Astrophysics + Cosmology = "the engines"

Unlocks could be:
- Pre-defined (curated) for known triplets
- Generated on demand by Opus when a new triplet is reached

Visually: when the third star in a constellation is visited, the three stars briefly trace a constellation line and a notification appears: "you have traced the substrates of self — a new constellation is open in the Index."

Implementation: ~200 LOC. Curated triplet definitions in data.js + detection logic.

### 6. Cosmic events (rare animated discoveries)
Occasionally — once every several minutes of viewing, randomized — a brief cinematic event:
- A comet streaks across the starfield, trailing a one-line fact
- A star pulses brighter for 5 seconds with a "spotlight" tag and a piece of its research
- A new nebula slowly fades into existence and labels itself with a thematic mood

Each event is short (~5-8 seconds) and dismissable. The point is to feel like the universe is offering you something rather than waiting for you to ask.

Implementation: ~150 LOC. Event types, scheduler, animations.

### 7. Marginalia (per-planet trivia markers)
Tiny clickable glyphs floating near a planet's surface in the planet view. Each glyph reveals a one-paragraph side note — historical footnote, surprising quote, related joke, weird fact. Not part of the main documents — the actual margins of the page.

Implementation: ~100 LOC + content authoring (~3 marginalia per topic). Could also be AI-generated on demand.

### 8. Random-walk button
A button somewhere — "wander" — that picks a random topic and warps you there. Pure serendipity. For when you're not curious about anything in particular and want the library to choose for you.

Implementation: ~20 LOC. Trivial.

### 9. The Compendium (visited-topics scrapbook)
A separate view (or section in the Index) showing every entry you've actually opened, with the date you first opened it and any notes you've added. Effectively a journal of your reading.

Implementation: ~200 LOC. localStorage-backed reading history + a compendium view.

### 10. Cross-references inside prose
Names and concepts within document prose get auto-linked if they match other topics or moons. Hovering shows a tiny preview; clicking warps. The encyclopedia's "see also" inline.

Implementation: ~120 LOC. Post-render DOM walk replacing known phrases with span.cross-ref elements. Risk: false positives need a stoplist.

---

## Underlying principles

A few rules that should guide which mechanics get built:

1. **No notification spam.** Surfacings (DYK cards, cosmic events, daily reads) must be paced sparsely — minutes between, not seconds. The galaxy should mostly be quiet so when it speaks, you notice.

2. **No achievement loops.** This isn't gamification. No points, badges, levels, streaks. The reward is the knowledge.

3. **Every surface should be a door.** Anything that catches your eye should be clickable and warp somewhere relevant. No dead text.

4. **Surfacings draw from real content.** "Did you know" facts come from the actual research entries, not from filler. Tangents come from real connections, not random.

5. **The user remains in control.** Every auto-surfaced thing has a dismiss button and the system respects "no, not interested" — that surfacing won't reappear soon.

---

## Build order (recommended)

Suggested next pieces, in order of impact × effort:

1. **Tangent buttons** — high impact for "wander next" feel, ~80 LOC
2. **The Index** — encyclopedia structural piece, ~150 LOC
3. **Random-walk "wander" button** — 20 LOC, trivial
4. **Visit trails** — strong "your galaxy" feel, ~120 LOC
5. **Daily first read** — small but recurring delight, ~60 LOC

Then in a second wave:
6. **Cosmic events** — cinematic, ~150 LOC
7. **Constellation patterns** — narrative reward, ~200 LOC
8. **Marginalia** — content-heavy, ~100 LOC + writing
9. **Compendium** — journaling, ~200 LOC
10. **Cross-references inline** — risk of false positives, lower priority

Say which to build next.
