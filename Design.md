# ATRIQUET Style Intelligence Atelier

## Product Overview

**The Pitch:** An authoritative, elite digital atelier providing algorithmic style intelligence to high-net-worth individuals and fashion houses. It strips away the fluff of traditional fashion blogs to deliver raw, uncompromising trend data and curation through a striking brutalist editorial lens.

**For:** Luxury fashion buyers, creative directors, and ultra-wealthy individuals who value uncompromising aesthetic authority and exclusivity.

**Device:** desktop

**Design Direction:** High-Fashion Editorial (Brutalist Luxury). Pure high-contrast black and white, razor-sharp serifs mixed with aggressive grotesques, and grid-breaking layouts that demand attention.

**Inspired by:** SSENSE, Balenciaga digital experiences, high-end print editorial (e.g., *System Magazine*).

---

## Screens

- **The Manifesto (Home):** Cinematic entry point establishing uncompromising authority.
- **The Intelligence (Index):** Grid-breaking archive of style reports and trend data.
- **The Dossier (Detail):** Immersive, stark reading experience for individual intelligence drops.
- **The Syndicate (Membership):** High-friction, brutalist application form for elite access.

---

## Key Flows

**Accessing Intelligence:** The user seeks the latest trend dossier.

1. User is on **The Manifesto (Home)** and sees stark, oversized typographic ticker and cinematic background.
2. User clicks `ENTER THE ARCHIVE` and navigates to **The Intelligence (Index)**.
3. User hovers over a report card and the image inverts to negative, revealing data points.
4. User clicks a report and lands on **The Dossier (Detail)** for deep, focused reading.

---

<details>
<summary>Design System</summary>

## Color Palette

- **Primary:** `#000000` - Absolute black for intense contrast, buttons, stark backgrounds
- **Background:** `#FFFFFF` - Bleach white for blinding canvas
- **Surface:** `#0A0A0A` - Near-black for hovering cards or inverted states
- **Text:** `#000000` - Ink black for maximum legibility on white
- **Muted:** `#888888` - Mid-grey for metadata, timestamps, 1px structural borders
- **Accent:** `#FF0000` - Blood red for vital data points and critical CTAs (used sparingly)

## Typography

Distinctive, aggressive, and highly editorial.

- **Display Serif (Logos, Big Headlines):** `Bodoni Moda`, 800 Italic, 64-120px, tight tracking
- **Grotesque (Headings, UI):** `Clash Display`, 600, 24-48px, uppercase
- **Body:** `Inter Tight`, 400, 16px, 150% line-height (utilitarian contrast to display fonts)
- **Monospace (Data/Meta):** `JetBrains Mono`, 400, 12px, uppercase
- **Buttons:** `Clash Display`, 600, 14px, uppercase, wide tracking

**Style notes:** `0px` border radius everywhere. Sharp corners. Hairline `1px` borders dissecting the screen. Extreme scale contrast (massive text next to tiny monospace). No soft drop shadows; only solid block shadows or stark inversions.

## Design Tokens

```css
:root {
  --color-primary: #000000;
  --color-background: #FFFFFF;
  --color-surface: #0A0A0A;
  --color-text: #000000;
  --color-muted: #888888;
  --color-accent: #FF0000;

  --font-display: 'Bodoni Moda', serif;
  --font-heading: 'Clash Display', sans-serif;
  --font-body: 'Inter Tight', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius: 0px;
  --spacing-sm: 16px;
  --spacing-md: 32px;
  --spacing-lg: 80px;
  --spacing-xl: 160px;
}
```

</details>

---

<details>
<summary>Screen Specifications</summary>

### The Manifesto (Home)

**Purpose:** Intimidate and intrigue the user; establish the Atelier's supreme authority.

**Layout:** Split screen, `1px` horizontal and vertical borders dividing quadrants. Massive typography overlapping boundaries.

**Key Elements:**
- **Hero Typography:** `ATRIQUET` in `Bodoni Moda`, `180px`, overlapping a stark black-and-white cinematic runway loop.
- **Ticker Tape:** Bottom edge scrolling marquee, `JetBrains Mono`, `14px`, flashing live trend data and stock index numbers.
- **The Gateway Button:** Bottom right quadrant, solid black box, `ENTER ATELIER` in white, absolute bottom right alignment.

**States:**
- **Loading:** Entire screen is `#000000`, `ATRIQUET` flashes `#FFFFFF` in morse code rhythm.

**Components:**
- **Gateway Button:** `320px x 80px`, `#000000` background, `#FFFFFF` text, sharp corners.

**Interactions:**
- **Hover Gateway Button:** Background inverts to `#FF0000`, text to `#000000`, cursor becomes crosshair.

**Responsive:**
- **Desktop:** 4-quadrant rigid grid.
- **Tablet:** 2-column stack.
- **Mobile:** Single column, hero typography scales down to `80px`.

### The Intelligence (Index)

**Purpose:** Browse the archive of style reports and data sets.

**Layout:** Asymmetric 3-column masonry grid. Images do not align to text. Intentional whitespace.

**Key Elements:**
- **Nav Header:** `80px` height, bottom `1px` solid border `#000000`. Logo left, `[01] ARCHIVE` right.
- **Dossier Cards:** Full-bleed black-and-white editorial photos, title in `Clash Display` offset and overlapping the image, timestamp in monospace.
- **Data Sidebar:** Fixed right column, `300px` wide, live scrolling feed of micro-trends.

**States:**
- **Empty:** `NO INTELLIGENCE FOUND` in `120px` `Bodoni Moda`.

**Components:**
- **Dossier Card:** Variable height, grayscale image filter, `#000000` text offset by `-40px`.

**Interactions:**
- **Hover Dossier Card:** Image switches from grayscale to full color instantly, no transition. Text gets black highlight with white text.

**Responsive:**
- **Desktop:** 3 columns plus fixed sidebar.
- **Tablet:** 2 columns.
- **Mobile:** 1 column, full-width images.

### The Dossier (Detail)

**Purpose:** Deep, distraction-free reading of a trend report.

**Layout:** Massive top header area (`80vh`), narrow reading column (`600px`) centered on a vast white background.

**Key Elements:**
- **Hero Image:** `100vw x 80vh`, stark cinematic crop.
- **Headline:** Overlaid on hero image, bottom-left aligned, `Bodoni Moda` Italic, `96px`, `#FFFFFF` text on `#000000` background block.
- **Body Text:** Centered `600px` column, `16px` body font, massive `120px` drop cap.
- **Data Modules:** Interrupting the text, `100vw` wide black bands containing white monospace charts and graphs.

**States:**
- **Loading:** Skeleton loader using pure black rectangles.

**Components:**
- **Data Module:** `100vw x 400px`, `#000000` background, `#FFFFFF` data plots.

**Interactions:**
- **Scroll:** Hero image parallax is disabled; static, harsh scrolling.

**Responsive:**
- **Desktop:** `600px` center reading column.
- **Tablet:** `80%` width reading column.
- **Mobile:** `90%` width, `48px` headline.

### The Syndicate (Membership)

**Purpose:** Gatekeeping access; capturing elite leads.

**Layout:** Two-column split. Left side static manifesto, right side brutalist form.

**Key Elements:**
- **Manifesto Left:** `#000000` background, `#FFFFFF` text. `APPLICATION FOR CLEARANCE` spanning the height of the screen.
- **Form Right:** `#FFFFFF` background. Inputs are just `1px` bottom borders, no boxes.
- **Submit Button:** Full width of the right column, bottom fixed, massive `120px` height.

**States:**
- **Error:** Missing fields turn `#FF0000`, aggressive error text: `INCOMPLETE DOSSIER`.

**Components:**
- **Input Field:** `100%` width, `0px` border-top/left/right, `2px` solid `#000000` border-bottom, massive `32px` input text.

**Interactions:**
- **Focus Input:** Border-bottom expands to `8px` solid black.
- **Click Submit:** Form collapses into a single spinning black square.

**Responsive:**
- **Desktop:** 50/50 split screen.
- **Tablet:** Stacked, `50vh` manifesto, `50vh` form.
- **Mobile:** Manifesto hidden, form only.

</details>

---

<details>
<summary>Build Guide</summary>

**Stack:** HTML + Tailwind CSS v3

**Build Order:**
1. **The Intelligence (Index)** - Establishes the core typographic hierarchy, `1px` border grid system, and stark image treatments.
2. **The Dossier (Detail)** - Nails down the intense long-form reading typography and scale contrasts.
3. **The Manifesto (Home)** - Applies the established system to a high-impact, kinetic hero layout.
4. **The Syndicate (Membership)** - Extends the brutalist aesthetic into interactive form elements.

</details>
