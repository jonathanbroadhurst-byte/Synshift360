# Quantum Leadership Calibration 360 Design Guidelines

## Design Approach
**Hybrid Professional-Scientific**: Drawing inspiration from Linear's precision, Notion's data hierarchy, and scientific visualization platforms. Premium SaaS aesthetic with emphasis on data clarity and visual sophistication.

## Typography
- **Primary Font**: Inter (Google Fonts) - Clean, scientific precision
- **Accent Font**: Space Grotesk (Google Fonts) - Modern, technical headlines
- **Hierarchy**: 
  - Hero/H1: Space Grotesk, 3xl-5xl, font-bold
  - Section Headers: Space Grotesk, 2xl-3xl, font-semibold
  - Data Labels: Inter, sm-base, font-medium
  - Body/Metrics: Inter, sm-base, font-normal
  - Fine Print: Inter, xs-sm, font-normal

## Layout System
**Spacing Units**: Tailwind 4, 6, 8, 12, 16, 24 for consistency
- Section padding: py-16 md:py-24
- Component spacing: gap-6 to gap-12
- Container: max-w-7xl with px-6

## Hero Section
**Full-viewport gradient background** (not image-based) with orange→magenta→black radial gradient as specified. Hero contains:
- Large headline with product tagline
- Brief value proposition (2-3 lines)
- Primary CTA button with blurred backdrop
- Floating preview of 9-box grid visualization (transparent overlay)
- Height: min-h-[85vh]

## Core Components

**Rating Scale (1-10)**
- Horizontal slider with numeric markers
- Interactive dots at each number
- Current selection highlighted with gradient accent
- Labels above/below scale
- Responsive: Stacks to vertical on mobile

**Maturity Level Display**
- Four-stage progression bar (Reactive→Transitional→Adaptive→Quantum)
- Each stage as card with icon, title, description
- Active stage with gradient border treatment
- Connecting lines between stages
- Grid layout: 2x2 on mobile, 1x4 on desktop

**9-Box Grid Visualization**
- 3x3 grid with axis labels (X: Performance, Y: Potential)
- Each cell interactive with hover state
- Data points plotted as circles with initials
- Color-coded by category
- Legend positioned bottom-right
- Grid lines subtle, labels prominent

**Assessment Cards**
- White/light containers with subtle shadow
- Category header with icon
- Multiple rating rows per card
- Progress indicators showing completion
- 2-column grid on desktop, stack on mobile

**Data Dashboard Section**
- Three metric cards showing key statistics
- Circular progress indicators
- Trend indicators (↑↓)
- Grid: 1 col mobile, 3 cols desktop

## Page Structure
1. **Hero**: Gradient background with headline, CTA, visualization preview
2. **Overview**: Maturity model explanation with 4-stage cards
3. **Assessment Interface**: Multiple category cards with rating scales
4. **Results Visualization**: 9-box grid with data points
5. **Insights Dashboard**: Metric cards and recommendations
6. **Footer**: Minimal with platform branding

## Images
**Hero Background**: None - use specified gradient
**Maturity Stage Icons**: Abstract geometric icons representing each level (circle→triangle→hexagon→star progression)
**Dashboard**: Optional abstract data visualization background patterns (subtle, low opacity)

## Visual Polish
- Gradient accents on interactive elements
- Subtle shadows for depth (shadow-sm to shadow-lg)
- Border radius: rounded-lg for cards, rounded-full for buttons
- Transitions: transition-all duration-200 for interactions
- Glass-morphism effects on floating elements

## Accessibility
- WCAG AA contrast ratios on gradient backgrounds
- Focus states with visible outlines
- Keyboard navigation for all interactive elements
- ARIA labels on data visualizations
- High contrast mode compatible