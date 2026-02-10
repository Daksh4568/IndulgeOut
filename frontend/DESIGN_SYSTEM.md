# IndulgeOut Frontend Design System

## Typography

### Fonts
- **Primary Font (Headings)**: `Oswald, sans-serif`
- **Secondary Font (Body/Subheadings)**: `Source Serif Pro, serif`

### Heading Hierarchy

#### H1 - Hero Headings
- **Font**: Oswald
- **Size**: 
  - Mobile: `text-3xl` (30px)
  - Tablet: `md:text-5xl` (48px)
  - Desktop: `lg:text-6xl` (60px)
- **Weight**: `font-bold` (700)
- **Example**: Hero section "YOUR GO-TO FOR OFFLINE EXPERIENCES"

#### H2 - Section Headings
- **Font**: Oswald
- **Size**: 
  - Mobile: `text-3xl` to `text-4xl` (30px - 36px)
  - Tablet: `sm:text-4xl` / `md:text-5xl` (36px - 48px)
  - Desktop: `md:text-5xl` (48px)
- **Weight**: `font-bold` (700)
- **Color**: `text-white`
- **Examples**: "Hear From Our Community", "PARTNER WITH US", "Our Social Footprint"

#### H3 - Card/Subsection Headings
- **Font**: Oswald
- **Size**: `text-2xl` (24px)
- **Weight**: `font-bold` (700)
- **Color**: `text-gray-900` (for light backgrounds)
- **Example**: Partner card titles

### Body Text / Subheadings

#### Section Descriptions
- **Font**: Source Serif Pro
- **Size**: 
  - Small: `text-sm` (14px) to `text-base` (16px)
  - Medium: `text-base` (16px) to `text-lg` (18px)
  - Large: `text-xl` (20px)
- **Weight**: `font-normal` (400)
- **Color**: 
  - Dark backgrounds: `text-gray-400` or `text-gray-300`
  - Light backgrounds: `text-gray-600`
- **Line Height**: `leading-relaxed`

#### Card Body Text
- **Font**: Source Serif Pro
- **Size**: `text-base` (16px)
- **Color**: `text-gray-600`
- **Line Height**: `leading-relaxed`

---

## Color Palette

### Brand Colors

#### Primary Colors
- **Light Purple**: `#7878E9`
- **Dark Purple**: `#3D3DD4`
- **Medium Purple**: `#5656D3`

### Background Colors
- **Black**: `bg-black` (#000000)
- **Zinc Gray (Light)**: `bg-zinc-900` (#18181b)
- **Zinc Gray (Medium)**: `bg-zinc-800` (#27272a)
- **White**: `bg-white` (#ffffff)

### Text Colors
- **White**: `text-white` (#ffffff)
- **Light Gray**: `text-gray-300` (#d1d5db)
- **Medium Gray**: `text-gray-400` (#9ca3af)
- **Dark Gray**: `text-gray-600` (#4b5563)
- **Black Text**: `text-gray-900` (#111827)

### Accent Colors
- **Stats/Highlights**: `#5656D3`
- **Success/Active**: `text-green-600` / `text-green-400`

---

## Buttons

### Primary CTA Buttons (Main Actions)

#### Style Specifications
- **Background**: `linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)`
- **Text Color**: `text-white`
- **Shape**: `rounded-full` (fully rounded corners)
- **Font Weight**: `font-semibold` (600)
- **Text Transform**: Normal case (NOT uppercase)
- **Shadow**: `shadow-lg` or `shadow-2xl`

#### Size Variants

**Large Buttons** (Main CTAs like "EXPLORE NOW", "Partner Now")
- **Padding**: 
  - Mobile: `px-8 py-3` 
  - Desktop: `sm:px-12 sm:py-4`
- **Font Size**: 
  - Mobile: `text-base` (16px)
  - Desktop: `sm:text-lg` (18px)
- **Example Usage**: Homepage section CTAs, Partner section bottom button

**Medium Buttons** (Card Actions)
- **Padding**: `px-6 py-3.5`
- **Font Size**: `text-base` (16px)
- **Width**: `w-full` (inside cards)
- **Example Usage**: Partner card buttons

**Small Buttons** (Secondary Actions)
- **Padding**: `px-4 sm:px-6 py-2`
- **Font Size**: `text-xs sm:text-sm` (12px - 14px)
- **Text Transform**: `uppercase`
- **Tracking**: `tracking-wide`
- **Shape**: `rounded-md` (slightly rounded)
- **Example Usage**: "VIEW ALL" button in testimonials

#### Interactive States
- **Hover**: 
  - `hover:opacity-90`
  - `hover:scale-105` (for large/medium buttons)
- **Transition**: `transition-all duration-300`

---

## Button Usage Guidelines

### Primary CTA Buttons
Use for main conversion actions:
- "EXPLORE NOW"
- "Partner Now"
- "Collaborate Now"
- "Create Now"
- Navigation "LOG IN /SIGN UP"

**Code Template:**
```jsx
<button
  onClick={handleClick}
  className="text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
>
  Button Text
</button>
```

### Medium Card Buttons
Use inside cards for specific actions:

**Code Template:**
```jsx
<button
  onClick={handleClick}
  className="w-full text-white px-6 py-3.5 rounded-full text-base font-semibold transition-all duration-300 transform hover:scale-105 hover:opacity-90 shadow-lg"
  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
>
  Button Text
</button>
```

### Small Secondary Buttons
Use for secondary actions or inline CTAs:

**Code Template:**
```jsx
<button
  onClick={handleClick}
  className="text-white px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-semibold uppercase tracking-wide transition-all hover:opacity-90"
  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
>
  VIEW ALL
</button>
```

---

## Navigation Bar

### Logo
- **Image**: `/images/LogoFinal.jpg` (horizontal white logo)
- **Height**: 
  - Mobile: `h-12` (48px)
  - Desktop: `sm:h-16` (64px)
- **Width**: `w-auto`

### Login Button
- **Same gradient as CTA buttons**: `linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)`
- **Shape**: `rounded-md`
- **Padding**: `px-4 sm:px-6 py-2`
- **Font Size**: `text-xs sm:text-sm`
- **Text Transform**: `uppercase`
- **Text**: "LOG IN /SIGN UP"

---

## Spacing & Layout

### Section Spacing
- **Standard Section Padding**: `py-20` (top and bottom)
- **Container Max Width**: `max-w-7xl mx-auto`
- **Container Padding**: `px-4 sm:px-6 lg:px-8`

### Component Spacing
- **Section Title to Description**: `mb-4` to `mb-6`
- **Description to Content**: `mb-12` to `mb-16`
- **Card Internal Padding**: `p-6` to `p-8`

---

## Cards & Components

### Partner Cards
- **Background**: `bg-white`
- **Border Radius**: `rounded-3xl` (large rounded corners)
- **Shadow**: `shadow-2xl`
- **Height**: Fixed `h-[580px]`
- **Max Width**: `max-w-md`
- **Image Height**: `h-[280px]`
- **Content Padding**: `p-8`
- **Layout**: Flexbox column with image on top

### Orbital Animation Circles
- **Background**: `bg-zinc-800/60 backdrop-blur-sm`
- **Size**: `w-28 h-28` to `lg:w-36 lg:h-36`
- **Shape**: `rounded-full`
- **Shadow**: `shadow-2xl`
- **Central Logo Background**: `bg-zinc-900 backdrop-blur-sm`

### Stats Cards
- **Background**: `bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900`
- **Border Radius**: `rounded-3xl`
- **Padding**: `py-20 p-8 md:p-12`
- **Glass Effect**: 
  - `bg-gradient-to-b from-white/5 via-transparent to-transparent`
  - `bg-gradient-to-tr from-transparent via-white/3 to-transparent`

---

## Responsive Design Breakpoints

### Tailwind Breakpoints Used
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px

### Common Responsive Patterns
- Mobile-first approach
- Hide/show elements: `hidden sm:block` or `md:hidden`
- Responsive text sizes: `text-base sm:text-lg lg:text-xl`
- Responsive padding: `px-4 sm:px-6 lg:px-8`
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## Shadows & Effects

### Box Shadows
- **Light**: `shadow-lg`
- **Medium**: `shadow-xl`
- **Heavy**: `shadow-2xl`

### Transitions
- **Standard**: `transition-all duration-300`
- **Smooth**: `transition-colors duration-300`
- **Fast**: `transition-opacity duration-700`

### Hover Effects
- **Scale**: `hover:scale-105`
- **Opacity**: `hover:opacity-90`
- **Shadow**: `hover:shadow-2xl`
- **Background**: `hover:bg-black/50`

---

## Special Components

### Video Modal Close Button
- **Background**: `bg-black/50 hover:bg-black/70`
- **Shape**: `rounded-full`
- **Padding**: `p-2`
- **Position**: `absolute top-4 right-4 z-10`

### Social Media Instagram Overlay
- **Background**: `bg-black/30 hover:bg-black/50`
- **Icon Size**: `w-12 h-12`
- **Transition**: `transition-colors`

---

## Implementation Checklist

When creating new pages or components, ensure:

1. ✅ Use Oswald for all headings (H1, H2, H3)
2. ✅ Use Source Serif Pro for body text and descriptions
3. ✅ All CTA buttons use gradient: `linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)`
4. ✅ Large buttons are `rounded-full`, small buttons are `rounded-md`
5. ✅ Maintain consistent spacing with `py-20` for sections
6. ✅ Use `max-w-7xl mx-auto` for container width
7. ✅ Apply hover effects: `hover:scale-105 hover:opacity-90`
8. ✅ Use `shadow-2xl` for prominent elements
9. ✅ Mobile-first responsive design with sm/md/lg breakpoints
10. ✅ White text on dark backgrounds, dark text on light backgrounds

---

## Notes

- **Gradient Direction**: Always `180deg` (top to bottom)
- **Gradient Stop 1**: `#7878E9` at `11%`
- **Gradient Stop 2**: `#3D3DD4` at `146%` (extends beyond 100% for softer transition)
- This creates a predominantly light blue button with smooth transition to darker shade
- Avoid using intermediate stops (like 46%, 85%) as they make the button too dark

---

**Last Updated**: January 29, 2026
**Version**: 1.0
