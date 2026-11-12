---
name: abdielvega.com — Portfolio
description: The engineer from Minneola, packed and labeled like the town's namesake tangelo.
colors:
  lake: '#14246a'
  lake-deep: '#0d1849'
  reef: '#2d55c4'
  mist: '#c9d3f2'
  grove: '#1d673c'
  sprout: '#74a845'
  lemon: '#f7c838'
  tangelo: '#f0601a'
  paper: '#fffcf5'
  error-ink: '#a8360c'
typography:
  display:
    fontFamily: "Ultra, 'Rockwell Extra Bold', serif"
    fontSize: 'clamp(3.5rem, 10vw, 8rem)'
    fontWeight: 400
    lineHeight: 0.86
  headline:
    fontFamily: "Ultra, 'Rockwell Extra Bold', serif"
    fontSize: 'clamp(2.75rem, 6.5vw, 5.5rem)'
    fontWeight: 400
    lineHeight: 0.95
  title:
    fontFamily: "Ultra, 'Rockwell Extra Bold', serif"
    fontSize: 'clamp(1.6rem, 3vw, 2.5rem)'
    fontWeight: 400
    lineHeight: 1.02
  body:
    fontFamily: "'Libre Franklin', 'Franklin Gothic Medium', sans-serif"
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.7
  lede:
    fontFamily: "'Libre Franklin', 'Franklin Gothic Medium', sans-serif"
    fontSize: 'clamp(1.75rem, 4vw, 3.5rem)'
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: '-0.02em'
  label:
    fontFamily: "'Big Shoulders', 'Arial Narrow', sans-serif"
    fontSize: '1.125rem'
    fontWeight: 800
    letterSpacing: '0.12em'
  script:
    fontFamily: 'Yellowtail, cursive'
    fontSize: '2rem'
    fontWeight: 400
  stencil:
    fontFamily: "'Big Shoulders Stencil', sans-serif"
    fontSize: 'clamp(3.25rem, 13vw, 11rem)'
    fontWeight: 800
    lineHeight: 0.82
rounded:
  none: '0px'
spacing:
  section: '10rem'
  section-mobile: '7rem'
  gutter: '2rem'
  gutter-mobile: '1rem'
  label-pad: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.lemon}'
    textColor: '{colors.lake}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '0 24px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.tangelo}'
    textColor: '{colors.paper}'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.paper}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    height: '48px'
  button-outline-hover:
    backgroundColor: '{colors.tangelo}'
  label-paper:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.lake}'
    rounded: '{rounded.none}'
    padding: '{spacing.label-pad}'
  label-grove:
    backgroundColor: '{colors.grove}'
    textColor: '{colors.paper}'
    rounded: '{rounded.none}'
    padding: '{spacing.label-pad}'
  input-field:
    backgroundColor: 'transparent'
    textColor: '{colors.lake}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
---

# Design System: abdielvega.com — Portfolio

Scope: the public portfolio (`app/(site)/*`, `components/site/*`). The budget and TV trackers keep their own editorial system (see CLAUDE.md) and must not inherit this one; everything here is scoped under `.crate`.

## Overview

**Creative North Star: "The Minneola Crate Label"**

Minneola, Florida, gave its name to the Minneola tangelo, and Lake County packed citrus under lithographed crate-end labels. The portfolio is one of those labels: flat inks printed plate by plate, a heavy Clarendon wordmark, a condensed American gothic for the variety line, one script flourish, and a stencilled crate end at the bottom. Every project is its own brand label in the crate.

The page is drenched in lake ultramarine. Colour arrives in whole fields (a lemon band, a grove label, a paper label), never as scattered accents. There are no gradients, no shadows, and no rounded corners: depth comes from ink fields and framing rules.

**Key Characteristics:**

- Drenched lake-blue ground; flat lithographic inks; no tints or gradients.
- Ultra wordmark headings as the largest mass on every page.
- Double-ruled label frames instead of cards and shadows.
- Tangelo reserved for what is active or moving.
- A press-run hero entrance; one authored motion moment per page.

## Colors

Five lithographic inks on a blue ground, each owning whole regions.

### Primary

- **Lake Ultramarine** (#14246a): the page ground everywhere on the portfolio; text colour on paper and lemon labels.
- **Crate Lemon** (#f7c838): label rules on blue, the variety band, the Currently band, the primary button, script flourishes.

### Secondary

- **Grove Green** (#1d673c): the footer field and alternating project/tool labels.
- **Sprout** (#74a845): the stencilled crate-end wordmark and near hills in the illustration. Decorative only; never for body text on grove.
- **Reef Blue** (#2d55c4): rules between rows on the blue ground and one tool label; the lake in the illustration.

### Tertiary

- **Tangelo** (#f0601a): hover and focus states, the hero fruit. Never a resting fill for text.

### Neutral

- **Label Paper** (#fffcf5): paper labels (bio, form, close) and primary text on blue.
- **Mist** (#c9d3f2): secondary text on lake (9:1).
- **Deep Lake** (#0d1849): the darkest label ground, for contrast against the page.
- **Error Ink** (#a8360c): form errors on paper (tangelo is too light for small text).

### Named Rules

**The Tangelo Rule.** Tangelo marks what is active or in motion (hover, focus, the fruit being printed). It is never a resting text or button colour.
**The Whole Field Rule.** A colour commits to a region (a band, a label, the footer) or not at all.

## Typography

**Display Font:** Ultra (fallback Rockwell Extra Bold, serif)
**Body Font:** Libre Franklin (fallback Franklin Gothic Medium, sans-serif)
**Label Font:** Big Shoulders, with Big Shoulders Stencil for the crate end and Yellowtail for a single script word per block.

**Character:** A crate label's type kit: a fat slab wordmark, a tall condensed gothic stamped in caps, a period script, and a plain American gothic for reading.

### Hierarchy

- **Display** (Ultra 400, clamp(3.5rem, 10vw, 8rem), 0.86): page h1s only.
- **Headline** (Ultra 400, clamp(2.75rem, 6.5vw, 5.5rem), 0.95): section h2s.
- **Title** (Ultra 400, clamp(1.6rem, 3vw, 2.5rem), 1.02): project names and label titles.
- **Lede** (Libre Franklin 600, clamp(1.75rem, 4vw, 3.5rem), 1.14, -0.02em): the home introduction, max 26ch.
- **Body** (Libre Franklin 400, 18–19px, 1.7): long reading, max 65ch.
- **Label** (Big Shoulders 700–800, 14–20px, 0.08–0.2em, uppercase): nav, meta lines, buttons, row labels.
- **Script** (Yellowtail, 1.75–2rem): one word per block ("In this crate", "Packed by", "Ready to ship").

### Named Rules

**The One Script Word Rule.** Yellowtail sets one short phrase per block, never a sentence or a heading.

## Layout

One container: max-width 1320px, 16px gutters on phones and 32px from 640px. A 12-column grid at 1024px+, with deliberately uneven spans for labels (7/5, 5/7, then a full-width row) so the crate never reads as a uniform card grid. Sections sit 7rem apart on phones and 10rem on desktop. The home hero is one framed label filling the first viewport (`100svh − 6.5rem`) on desktop. Full-bleed is reserved for the Currently band and the footer.

## Elevation & Depth

Flat. No box-shadows for depth. Depth comes from ink fields stacked on the blue ground and from the double label rule. The only `box-shadow` in the system is the inset second rule of `.label-rule`.

### Named Rules

**The Printed Flat Rule.** Nothing floats. A label sits on the ground; on hover it lifts 2px and its rule turns tangelo.

## Shapes

Square corners throughout (radius 0). Two exceptions, both from the label world: the hero illustration's arched window and the oval portrait vignette. Frames are a 3px rule, a 5px gap of the label's own ground, then a 1px rule (`.label-rule`, driven by `--rule` and `--ground`).

## Components

### Buttons

- **Shape:** square (0px), min-height 48px, 24–28px horizontal padding, Big Shoulders 800 uppercase at 0.12em.
- **Primary:** lemon field, lake text. Hover: tangelo field, paper text.
- **Outline:** 2px paper border on blue. Hover: tangelo field and border.
- **On paper:** lake field, paper text; hover tangelo.
- **Motion:** `.press` steps up 2px on hover and presses down 1px on click.

### Labels (signature component)

- Each project is a `ProjectLabel`: an ink pairing cycled from paper, grove, lemon and deep lake, alternating centred and left-aligned compositions.
- Content order: variety (language) · packed date, Ultra name, description, topics and stars, arrow.
- Hover/focus: lifts 2px, rule turns tangelo, arrow nudges up-right.

### Inputs / Fields

- **Style:** transparent, a 2px lake/30% underline, 18px Libre Franklin in lake. The label is Big Shoulders uppercase and is always visible.
- **Focus:** underline turns tangelo; caret tangelo.
- **Error:** underline and message in error ink (#a8360c), linked by `aria-describedby`.

### Navigation

- AV seal (2px lemon ring, Ultra initials) plus the name, then five gothic uppercase links. Mist at rest, paper on hover, lemon when current, with an underline that draws in from the left. Links wrap tighter below 400px; there's no hamburger menu.

### Share image and 404

- `app/opengraph-image.tsx` renders the hero label (wordmark, lemon variety band, `GroveScene` with literal hex inks) at 1200×630.
- `app/not-found.tsx` serves a crate label (seal, Ultra 404, script line, lemon button) on the portfolio, and the editorial 404 on the tracker hosts.

### Footer (crate end)

- A grove field with a stencilled "MINNEOLA · FLA." in sprout, then colophon, correspondence, and © columns with lemon gothic headings.

## Do's and Don'ts

### Do:

- **Do** keep the lake ground on every portfolio page and put content on whole ink fields.
- **Do** frame labels with `.label-rule` and set `--rule` / `--ground` per label.
- **Do** give each page one authored motion: the home press-run plus lede inking, the about duotone portrait, route slaps between pages. Everything rests under `prefers-reduced-motion`.
- **Do** keep tap targets at 44px minimum (`min-h-11`).

### Don't:

- **Don't** use gradients, drop shadows, glass, or rounded cards.
- **Don't** use tangelo for resting text or small text on paper; use error ink for errors.
- **Don't** set body text in sprout on grove (2.5:1).
- **Don't** add eyebrow/kicker labels above headings or section numbers.
- **Don't** let any of this leak into the trackers; keep it under `.crate`.
