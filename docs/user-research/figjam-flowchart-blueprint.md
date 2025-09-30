# FigJam User Journey Flowchart Blueprint

## Canvas Layout Overview
**Canvas Size**: 3000 x 2000px (landscape orientation)
**Sections**: 5 horizontal swim lanes + decision tree area
**Color Coding**: Green (positive), Red (friction), Yellow (decision points), Blue (interventions)

---

## SWIM LANE 1: ENTRY SCENARIOS (Top Section)
**Height**: 300px | **Color**: Light Blue Background

### Entry Point Boxes (Left to Right):
1. **Google Search** 📱
   - Size: 120x80px
   - Icon: Search icon
   - Subtext: "Frustrated, urgent"
   - Time: "0s"

2. **Referral Link** 🔗
   - Size: 120x80px  
   - Icon: Link icon
   - Subtext: "Primed trust"
   - Time: "0s"

3. **Agency Direct** 💼
   - Size: 120x80px
   - Icon: Briefcase
   - Subtext: "Ready to invest"
   - Time: "0s"

4. **Social Media** 📱
   - Size: 120x80px
   - Icon: Social icons
   - Subtext: "Curious browsing"
   - Time: "0s"

5. **Return Visit** 🔄
   - Size: 120x80px
   - Icon: Return arrow
   - Subtext: "Continuing journey"
   - Time: "0s"

**Flow Arrows**: All point down to Landing Decision Point

---

## SWIM LANE 2: LANDING & FIRST IMPRESSION (0-30 seconds)
**Height**: 400px | **Color**: Light Gray Background

### Central Landing Page Box:
- **Size**: 200x120px
- **Position**: Center
- **Content**: "Homepage Landing"
- **Time Indicator**: "0-30s"

### Decision Diamond (Yellow):
- **Size**: 100x100px
- **Position**: Below landing box
- **Content**: "Stay or Leave?"
- **Time**: "15-30s"

### Stay Triggers (Green boxes - Right side):
- ✅ "Clear SMB Focus" (80x40px)
- ✅ "Specific Problems" (80x40px)
- ✅ "Professional Feel" (80x40px)
- ✅ "Easy Navigation" (80x40px)

### Leave Triggers (Red boxes - Left side):
- ❌ "Generic Messaging" (80x40px)
- ❌ "Tech Jargon" (80x40px)
- ❌ "SaaS Clone Look" (80x40px)
- ❌ "No Clear CTA" (80x40px)

### Friction Points (Red diamonds):
- "Too Many Options" (60x60px)
- "Slow Loading" (60x60px)
- "Mobile Issues" (60x60px)

---

## SWIM LANE 3: EXPLORATION PATHS (30s - 5min)
**Height**: 500px | **Color**: Light Green Background

### Two Main Paths (Parallel):

#### Path A: Tool Directory (Left Branch)
1. **"Browse Tools" Click** (100x60px)
   - Time: "30s"
   - Arrow down to:

2. **AI Tools Discovery** (120x80px)
   - Icon: Grid view
   - Time: "1-2min"
   - Arrow down to:

3. **Filter & Search** (100x60px)
   - Time: "2-3min"
   - Arrow down to:

4. **Tool Cards View** (100x60px)
   - Time: "3-5min"

#### Path B: Nova Chat (Right Branch)
1. **Nova Chat Bubble** (100x60px)
   - Icon: Chat bubble
   - Time: "30s"
   - Arrow down to:

2. **Nova Introduction** (120x80px)
   - Icon: AI assistant
   - Time: "1min"
   - Arrow down to:

3. **Business Questions** (100x60px)
   - Time: "2-3min"
   - Arrow down to:

4. **Tool Recommendations** (100x60px)
   - Time: "3-5min"

### Decision Point (Yellow Diamond):
- **Position**: Center bottom
- **Size**: 120x120px
- **Content**: "Engage Deeper or Browse Passively?"
- **Time**: "5min"

---

## SWIM LANE 4: VALUE RECOGNITION (2-15min)
**Height**: 600px | **Color**: Light Yellow Background

### Deep Engagement Branches:

#### Tool Research Branch (Left):
1. **Tool Deep Dive** (100x60px)
   - Time: "5-8min"
   - Connected to:
   - "Read Descriptions" (80x40px)
   - "Check Pricing" (80x40px)
   - "ROI Calculation" (80x40px)

2. **Comparison Mode** (100x60px)
   - Time: "8-12min"
   - Connected to:
   - "Side-by-side" (80x40px)
   - "Reviews Check" (80x40px)
   - "Trial Options" (80x40px)

#### Nova Consultation Branch (Right):
1. **Context Sharing** (100x60px)
   - Time: "5-8min"
   - Connected to:
   - "Industry Input" (80x40px)
   - "Size Details" (80x40px)
   - "Challenge Sharing" (80x40px)

2. **Guided Recommendations** (100x60px)
   - Time: "8-15min"
   - Connected to:
   - "Personalized Tools" (80x40px)
   - "Implementation Order" (80x40px)
   - "ROI Estimates" (80x40px)

### Trust Level Indicators (Traffic Light System):
- **High Trust** (Green Circle): "Expert guidance feel"
- **Medium Trust** (Yellow Circle): "Good but generic"
- **Low Trust** (Red Circle): "Seems scripted"

---

## SWIM LANE 5: CONVERSION CONSIDERATION (5-30min)
**Height**: 500px | **Color**: Light Purple Background

### Conversion Paths (Three branches):

#### Soft Conversion: Email Signup
- **Trigger Box** (100x60px): "Save Tools Need"
- **Process Flow**:
  1. "Signup Prompt" (80x40px)
  2. "Simple Form" (80x40px)
  3. "Immediate Value" (80x40px)
  4. "Welcome Email" (80x40px)

#### Hard Conversion A: Paid Upgrade
- **Trigger Box** (100x60px): "Need More Features"
- **Process Flow**:
  1. "Hit Limits" (80x40px)
  2. "See Benefits" (80x40px)
  3. "ROI Justification" (80x40px)
  4. "Checkout" (80x40px)

#### Hard Conversion B: Agency Booking
- **Trigger Box** (100x60px): "Need Expert Help"
- **Process Flow**:
  1. "Complexity Realization" (80x40px)
  2. "Agency Option" (80x40px)
  3. "Case Studies" (80x40px)
  4. "Consultation Booking" (80x40px)

---

## DECISION TREES SECTION (Right Side of Canvas)
**Width**: 800px | **Position**: Right side, full height

### Primary Decision Tree Structure:

```
Landing Page
├── STAY (70%)
│   ├── Browse Directory (60%)
│   │   ├── Find Relevant Tools (80%)
│   │   │   ├── Deep Dive (40%)
│   │   │   └── Surface Browse (60%)
│   │   └── Don't Find Relevance (20%)
│   │       └── Exit (90%)
│   └── Try Nova Chat (40%)
│       ├── Helpful Response (70%)
│       │   ├── Continue Conversation (80%)
│       │   └── Browse Recommended Tools (20%)
│       └── Generic Response (30%)
│           └── Exit or Browse (50/50%)
└── LEAVE (30%)
    └── Bounce (Exit)
```

### Conversion Decision Tree:
```
Value Recognition
├── High Value Perceived (40%)
│   ├── Ready to Pay (30%)
│   │   ├── Starter Tier (70%)
│   │   └── Pro Tier (30%)
│   ├── Want Agency Help (20%)
│   │   └── Book Consultation (80%)
│   └── Try Free First (50%)
│       └── Email Signup (90%)
├── Medium Value (35%)
│   ├── Research More (60%)
│   └── Try Free (40%)
└── Low Value (25%)
    └── Exit (85%)
```

---

## TIMING ESTIMATES (Bottom Legend)
**Position**: Bottom right corner

- **Phase 1**: 0-30 seconds (Landing)
- **Phase 2**: 30s-5min (Discovery)
- **Phase 3**: 2-15min (Value Recognition)
- **Phase 4**: 5-30min (Conversion)
- **Critical Moments**: 15s, 2min, 8min, 15min

---

## FRICTION INDICATORS (Red Markers)
**Position**: Throughout canvas as red warning triangles

### High-Friction Points:
1. **0-15s**: Page load speed
2. **30s**: Clear value proposition
3. **2min**: Tool relevance
4. **5min**: Nova response quality
5. **8min**: Information overload
6. **15min**: Conversion complexity

---

## INTERVENTION OPPORTUNITIES (Blue Callouts)
**Position**: Strategic points throughout canvas

### Key Interventions:
1. **Exit Intent Detection** (0-30s)
2. **Smart Tool Filtering** (2-3min)
3. **Nova Personalization** (3-5min)
4. **Social Proof Insertion** (8-10min)
5. **ROI Calculator** (10-15min)
6. **Risk Mitigation Offers** (15min+)

---

## ALTERNATIVE PATH OVERLAYS
**Color**: Semi-transparent colored areas

### Price-Sensitive Path (Orange Overlay):
- Covers all pricing touchpoints
- Shows extended evaluation timeline
- Highlights ROI calculation moments

### Skeptical User Path (Purple Overlay):
- Shows trust-building checkpoints
- Emphasizes proof-seeking behavior
- Longer timeline indicators

### Mobile User Path (Green Overlay):
- Simplified interaction points
- Touch-optimized indicators
- Cross-device continuation points

### Agency Direct Path (Brown Overlay):
- Bypasses tool directory
- Direct to credibility assessment
- Shorter timeline to booking

---

## SUCCESS METRICS DASHBOARD (Top Right)
**Size**: 300x400px | **Color**: White background with border

### Conversion Funnel:
```
Landing Page Views: 100%
├── Engage (70%)
│   ├── Browse Tools (42%)
│   └── Chat with Nova (28%)
├── Value Recognition (35%)
├── Email Signup (20%)
├── Paid Conversion (5%)
└── Agency Booking (2%)
```

### Key Performance Indicators:
- **Bounce Rate**: <30% (Target)
- **Time on Site**: >5min (Engaged users)
- **Tool Views**: >3 tools (Quality engagement)
- **Nova Messages**: >5 exchanges (Deep engagement)
- **Email Signup**: 20% of engaged users
- **Paid Conversion**: 5% within 30 days
- **Agency Booking**: 2% of all visitors

---

## FIGJAM IMPLEMENTATION INSTRUCTIONS

### Step 1: Canvas Setup
1. Create new FigJam board (3000x2000px)
2. Add horizontal guidelines at 300px intervals
3. Set up color palette: Green (#4CAF50), Red (#F44336), Yellow (#FFC107), Blue (#2196F3)

### Step 2: Swim Lane Creation
1. Draw 5 horizontal sections with divider lines
2. Add section headers and background colors
3. Create entry point boxes in top section

### Step 3: Flow Creation
1. Start with main path flows using arrows
2. Add decision diamonds at key points
3. Connect alternative paths with dotted lines
4. Add timing indicators to all major steps

### Step 4: Interactive Elements
1. Add clickable hotspots for detailed views
2. Create expandable sections for sub-flows
3. Link related elements with connectors
4. Add comment bubbles for additional context

### Step 5: Testing Overlays
1. Create separate layers for each user type
2. Add toggle buttons to show/hide paths
3. Include percentage indicators on decision points
4. Add friction point markers throughout

This blueprint provides everything needed to create a comprehensive, interactive user journey flowchart in FigJam that can be used for stakeholder alignment and user testing preparation.