# Syft — UI Design Doc (Stitch-ready)

> **How to use this with Stitch:** Paste **§1 Design System** once at the top of a new Stitch
> project (or into the "style" field) so every generation shares the same look. Then for each
> screen, paste the matching **prompt block** from §3. Each block is self-contained and editable —
> tweak the bracketed `[…]` notes to steer the result. Keep the *Non-negotiables* (§2) intact;
> they're product law, not styling.
>
> **Tagline:** *Describe your person. Meet your match.*
> **Positioning:** "The search engine for human connection." Calm, intelligent, intentional —
> a thoughtful matchmaker, **never** a casino. No swiping, no infinite feed, no dopamine games.

---

## 1. Design System (paste into Stitch style / first prompt)

```
DESIGN SYSTEM — SYFT

Mood: calm, warm, intelligent, unhurried. The opposite of a slot machine. Generous
whitespace, soft edges, one warm accent on neutral cream grounds. The feeling is
"being understood," never "being judged." Smooth, slow motion. Mobile-first (iOS portrait,
390×844), single-column, large touch targets.

COLOR — warm cream / terracotta theme, light mode only (no dark mode):
- Background:            #f7f4ef  (warm cream — the canvas)
- Card surface:          #fffcf8  (off-white)
- Secondary surface:     #ede8e0  (soft tan — chips, inputs)
- Muted surface:         #e8e3da
- Foreground / text:     #1c1916  (near-black warm brown)
- Muted text:            #7a7166  (tan-brown, for captions/help)
- Primary (buttons/text):#1c1916
- ACCENT (the one warm pop): #c4673a  (terracotta/rust) — active states, primary CTAs,
                              progress fills, the voice orb, match-score highlights
- Accent text on accent: #fffcf8
- Border:                rgba(28,25,22,0.10)  (hairline brown)
- Error/destructive:     #d4183d  (use sparingly)
- Data-viz accents (use only for tags/insight chips, never as primary UI):
  #8b9e7a green · #6b8cae slate blue · #b5956a tan · #9b7b8e mauve

TYPOGRAPHY:
- Display / headlines / brand: "Lora" serif (400/500/600, italics allowed for brand voice).
  Use for the wordmark, hero lines, screen titles, and "why you fit" copy.
- UI / body / labels / buttons: "DM Sans" sans-serif (300/400/500/600).
- Base size 16px. Headlines generous (28–40px). Comfortable line height.

SHAPE & DEPTH:
- Corner radius: 12px base (cards, inputs, buttons). Pills fully rounded.
- Shadows: very soft, low-opacity, short — a 2px resting lift, slightly more on hover.
- Borders: hairline rgba(28,25,22,0.10). Inputs transparent until focused, then a subtle
  terracotta focus ring (accent at ~12% alpha).
- Buttons: large (full-width primary, ~52px tall). Active = scale 0.97–0.99.

MOTION:
- 0.2s–0.7s eased transitions. Breathing/scaling for the voice orb. No bouncy, no flashy.

AVOID (hard rules): loud reds, fire emojis, swipe decks, infinite scroll feeds, badges that
scream, casino/dopamine patterns, hearts-as-currency. No purple-gradient "AI" clichés.
```

---

## 2. Non-negotiables (don't let Stitch design these away)

- **Honest about match strength.** If the pool is thin, show "2 strong matches right now," not five fabricated ones. Confidence-aware empty/partial states are part of the design.
- **No protected-trait filtering.** Search must never offer to rank/filter on race, religion, ethnicity, disability, etc. The search UI includes a calm *refuse-and-reframe* state ("We match on compatibility, not [trait]").
- **Up to five results, never more.** Resist any layout that implies an endless deck.
- **Transparency as a feature.** Assessment/voice screens always tell the user what's being understood and why — framed as a benefit, shown back as insight.
- **User stays in control.** Syft surfaces candidates; the human chooses. No auto-match, no autoplay.
- **Claims discipline.** Copy says "understands who you are / matches you more deeply," **never** "predicts chemistry / guarantees compatibility."

---

## 3. Screen prompts (one block per screen — edit freely)

The flow is 5 stages → then the main app shell. Order matches the build order.

### 3.1 — Onboarding / Auth (Stage 1)

```
SCREEN: Onboarding hero + how-it-works, on the Syft cream background.
Top: small serif wordmark "Syft" in terracotta. Centered hero in large Lora serif:
"Describe your person." / "Meet your match." with a calm one-liner beneath in DM Sans muted
text: "No swiping. Just describe who you're looking for."
Middle: a 3-step "How Syft works" — three soft off-white cards stacked, each with a simple
line icon, a short title, one line of body:
  1. Build a profile that actually understands you
  2. Describe who you're looking for in plain English
  3. Meet a short list of people who truly fit
Bottom: full-width terracotta primary button "Get started", and a quieter text link
"I already have an account". Include a secondary "Continue with Google" outline button.
Generous whitespace, unhurried, no stock photos.
```

### 3.2 — Demographics & Preferences (Stage 2)

```
SCREEN: One-question-per-card assessment. Thin terracotta progress bar pinned at top
(e.g. step 3 of 7). One question in Lora serif, e.g. "Who are you open to meeting?".
Answers as tappable rounded chips on tan (#ede8e0); selected chip fills terracotta with
cream text. Some steps use a single text input or a slider (distance, height). Light, quick
feel despite depth. Bottom: a quiet "Back" text link on the left and a terracotta "Next"
button on the right. Lots of breathing room. No clutter, no dense forms.
```
*Editable: question set = age, location, gender, who you're open to, relationship type, max distance, height.*

### 3.3 — Profile & Intent: "In your words" (Stage 3a — writing)

```
SCREEN: Free-text reflection prompt under a single progress arc. Header tag in DM Sans:
"In your words". Title in Lora serif: a warm prompt like "Tell us about your perfect Sunday."
Below: a large, soft, borderless multi-line text area on an off-white card that gently shows
a focus ring in terracotta when active. Subtle character/encouragement hint in muted text.
After submit, show a light "personality reflection" reward card — a calm insight written back
to the user (framed as a reflection, NOT a score or diagnosis), with a "Continue" button.
Calm and rewarding, never clinical.
```

### 3.4 — Profile & Intent: "Let's talk" (Stage 3b — voice)

```
SCREEN: Voice conversation with Syft's assistant. Very calm, mostly empty screen on cream.
Center: a large breathing terracotta ORB that gently scales/ripples while listening, with
soft equalizer bars when the user speaks. A small "Let's talk" tag with a live pulsing dot
makes it obvious they're talking to Syft's AI. Below the orb: a LIVE TRANSCRIPT card showing
what's being heard (for trust/transparency). A large circular mic button at the bottom with
an obvious "Tap to pause". A quiet typed-fallback input link for accessibility. Status text
like "Listening…" / "Go ahead". Nothing flashy — meditative, trustworthy.
```

### 3.5 — Identity & Safety (Stage 4 — Stripe Identity)

```
SCREEN: Trust-gate verification, multi-step. Numbered step indicators in the header
(Intro → Consent → ID → Selfie → Done). Framed as "a mark of a serious, safe community,"
not a bureaucratic hurdle.
- Intro card: shield/check line icon, title "Verify you're really you", short reassurance,
  "Your data is yours" privacy line, terracotta "Begin verification" button.
- ID capture: a dashed-border upload zone for a government ID, calm instructions.
- Selfie capture: a circular framing guide for a selfie.
- Processing: a soft centered spinner with "Checking…".
- Success: large terracotta check, "You're verified", "Continue" button.
Emphasize age verification as a safety promise (copy, not a scary warning).
```

### 3.6 — Search Platform (Stage 5 — the hero screen)

```
SCREEN: The core discovery experience. NOT a swipe deck. Layout is a calm conversation:
- A scrollable thread area: the user's typed query appears as a right-aligned bubble in
  Lora-ish text; Syft replies with up to FIVE rich match cards.
- Each MATCH CARD (off-white, 12px radius, soft shadow): round avatar with initials,
  name + age + location, a small terracotta MATCH-STRENGTH indicator (e.g. a quiet
  "Strong match" pill, not a percentage gauge that screams), 1–2 line "why you two fit"
  explanation in serif, and two calm actions: "Like" (outline) and "Message" (terracotta).
- Pinned bottom COMPOSER: a soft text field "Describe who you're looking for…" with ghost
  example prompts when empty, and a terracotta send button. Small help text underneath.
- EMPTY STATE: inviting hero with 3 tappable example prompts.
- CONFIDENCE-HONEST STATE: when few fit, show e.g. "2 strong matches right now" with an
  honest line, never padded to five.
- REFUSE-AND-REFRAME STATE: if a query asks to filter on a protected trait, show a calm
  inline note "We match on compatibility, not [trait]" and still return results on the rest.
Rich, calm cards. No card stack, no swipe gestures, no "X / heart" buttons.
```

### 3.7 — Messages / Chats (post-match)

```
SCREEN: Messages. Two states.
- INBOX: a clean list of connections — round avatar initials, name + age, one-line preview
  of the last message, subtle timestamp. Calm, generous row spacing. Unread shown with a
  small terracotta dot (not a loud badge).
- CHAT WINDOW: a standard warm messaging thread — incoming bubbles on tan, outgoing bubbles
  in terracotta with cream text, the matched person's name in the header with a small
  "why you matched" recap chip the user can tap. Bottom composer with send button.
Warm and human, not utilitarian.
```

### 3.8 — App Shell / Navigation

```
SCREEN: The post-onboarding shell. Top header: small terracotta "Syft" serif wordmark left,
optional profile avatar right. Primary navigation is a simple two-tab control —
"Discover" and "Messages" (Messages can show a small count). The body hosts either the Search
Platform or the Messages view. Minimal chrome, lots of canvas. No bottom tab bar overloaded
with icons — keep it to the two core destinations.
```

---

## 4. Optional / later screens (stubs to expand in Stitch)

- **Density gate / waitlist** — when a geography is below the launch threshold: a calm screen with a live counter, e.g. *"147 people near you — search unlocks at 500,"* and a "Notify me" button. (Search stays locked, not broken.)
- **Photo shoot upsell** — optional paid professional shoot, framed as "present your best *real* self." Must NOT imply unshot profiles rank lower.
- **Events / mixers** — curated local mixer cards (cold-start/liquidity tool), low-pressure RSVP.
- **Subscription / paywall** — calm tier comparison (free = limited daily searches; paid ≈ $15–20/mo = unlimited search + richer "why you fit").
- **Profile settings / privacy** — "your data is yours" explainer, reciprocal-visibility & blocking controls, reporting.

---

## 5. Quick reference — token cheat sheet

| Token | Value | Use |
|---|---|---|
| Background | `#f7f4ef` | App canvas |
| Card | `#fffcf8` | Cards, sheets |
| Secondary | `#ede8e0` | Chips, inputs |
| Foreground | `#1c1916` | Text |
| Muted text | `#7a7166` | Captions, help |
| **Accent** | `#c4673a` | CTAs, active, orb, match strength |
| Accent text | `#fffcf8` | Text on accent |
| Border | `rgba(28,25,22,0.10)` | Hairlines |
| Error | `#d4183d` | Errors (sparingly) |
| Display font | **Lora** (serif) | Brand, titles, "why you fit" |
| UI font | **DM Sans** | Body, labels, buttons |
| Radius | `12px` | Everything; pills fully round |

*Source of truth for tokens: [syft-prototype/app/globals.css](../syft-prototype/app/globals.css). Keep this doc in sync if tokens change.*
```
