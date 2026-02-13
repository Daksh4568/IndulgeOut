# IndulgeOut Frontend Style Guide

## 📋 Overview
This document outlines the design system and styling standards for the IndulgeOut frontend application. Follow these guidelines to maintain consistency across all pages and components.

---

## Glass Morphism Card effect for signup pages
style={{
background: 'rgba(255, 255, 255, 0.03)',
backdropFilter: 'blur(10px)',
borderColor: 'rgba(255, 255, 255, 0.1)',
}}
For background image -
<div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
{/* Background Image with Opacity and Blur */}
<div
className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
style={{
backgroundImage: 'url(/imagesBackgroundLoginjpg)',
zIndex: 0,
}}
/>

## 🎨 Color Palette

### Primary Brand Colors
- **Purple Light**: `#7878E9`
- **Purple Dark**: `#3D3DD4`
- **Purple Medium**: `#5656D3`
- **Accent Orange**: `#FF6B35` / `#F97316` (orange-500)
- **Accent Pink**: `#EC4899` (pink-500)

### Neutral Colors
- **Background Dark**: `#000000` (Black)
- **Background Gray**: `#111827` (gray-900)
- **Section Gray Background**: `bg-zinc-900/50` with `border-gray-800` (Use this for all gray section cards)
- **Card Background Light**: `#FFFFFF` (White)
- **Card Background Dark**: `#1F2937` (gray-800)
- **Text Primary Dark**: `#111827` (gray-900)
- **Text Primary Light**: `#FFFFFF` (White)
- **Text Secondary**: `#6B7280` (gray-500)
- **Border**: `#E5E7EB` (gray-200) / `#374151` (gray-700 for dark mode)

### Button Default State
- **Default Background**: `#3A3A52` (Dark gray-blue)
- **Default Hover**: `#4A4A62` (Lighter gray-blue)
- **Default Text**: `#D1D5DB` (gray-300)

---

## 🔘 Button Styles

### Primary CTA Button (Active State)
```css
/* Gradient Background */
background: linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%);

/* Tailwind Classes */
className="text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
```

**Key Properties:**
- Background: Purple gradient (180deg)
- Padding: `px-8 sm:px-12` (responsive)
- Height: `py-3 sm:py-2` (responsive)
- Border Radius: `rounded-md` (medium rounded corners, NOT fully rounded)
- Text: White, semibold, responsive size
- Hover: Scale up (105%) + Opacity (90%)
- Shadow: `shadow-2xl` for depth
- Font Family: Oswald

### Default/Inactive Button State
```css
/* Background */
background-color: #3A3A52;

/* Tailwind Classes */
className="bg-[#3A3A52] text-gray-300 hover:bg-[#4A4A62] px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300"
```

**Key Properties:**
- Background: `#3A3A52` (consistent across all inactive buttons)
- Hover Background: `#4A4A62`
- Text: `gray-300`
- Same padding, sizing, and transitions as active state

### Secondary Button
```css
className="bg-white text-orange-500 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
```

---

## 📝 Typography

### Font Families
```css
/* Headings */
font-family: 'Oswald', sans-serif;

/* Body Text / Subheadings */
font-family: 'Source Serif Pro', serif;

/* Fallback */
font-family: system-ui, -apple-system, sans-serif;
```

### Heading Hierarchy
```css
/* H1 - Page Titles */
font-family: 'Oswald', sans-serif;
font-size: text-4xl md:text-5xl (36px / 48px);
font-weight: bold;
color: text-white / text-gray-900;

/* H2 - Section Titles */
font-family: 'Oswald', sans-serif;
font-size: text-3xl (30px);
font-weight: bold;
color: text-white / text-gray-900;

/* H3 - Card Titles */
font-family: 'Oswald', sans-serif;
font-size: text-xl sm:text-2xl (20px / 24px);
font-weight: bold;
color: text-gray-900;

/* Subheadings / Descriptions */
font-family: 'Source Serif Pro', serif;
font-size: text-base / text-lg (16px / 18px);
font-weight: normal;
color: text-gray-400 / text-gray-600;
```

---

## 🎯 Component Patterns

### Event Card (Horizontal - Carousel)
```jsx
<div className="bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
  <div className="flex flex-col sm:flex-row h-full">
    {/* Left Side - Content */}
    <div className="flex-1 p-6 flex flex-col justify-between">
      {/* Date & Time - Source Serif Pro */}
      <div className="flex items-center gap-2 text-gray-700 mb-3">
        <Calendar className="h-4 w-4" />
        <span style={{ fontFamily: 'Source Serif Pro, serif' }}>Date · Time</span>
      </div>
      
      {/* Title - Oswald */}
      <h3 style={{ fontFamily: 'Oswald, sans-serif' }}>Event Title</h3>
      
      {/* Location - Source Serif Pro */}
      <div className="flex items-start gap-2 text-gray-700 mb-4">
        <MapPin className="h-4 w-4" />
        <span style={{ fontFamily: 'Source Serif Pro, serif' }}>Location</span>
      </div>
      
      {/* Price - Oswald */}
      <span style={{ fontFamily: 'Oswald, sans-serif' }}>₹499 onwards</span>
      
      {/* CTA Button */}
      <button 
        className="text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
      >
        Get your Ticket
      </button>
    </div>
    
    {/* Right Side - Image */}
    <div className="w-full sm:w-1/2 h-64 sm:h-auto">
      <img src="..." className="w-full h-full object-cover" />
    </div>
  </div>
</div>
```

### Event Card (Vertical - Standard Grid)
```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
  {/* Image */}
  <div className="relative aspect-video overflow-hidden">
    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
  </div>
  
  {/* Content */}
  <div className="p-4">
    {/* Title - Oswald */}
    <h3 style={{ fontFamily: 'Oswald, sans-serif' }}>Event Title</h3>
    
    {/* Details - Source Serif Pro */}
    <div style={{ fontFamily: 'Source Serif Pro, serif' }}>
      {/* Date, Location, etc. */}
    </div>
  </div>
</div>
```

### Tab Navigation Buttons
```jsx
<button
  className={`px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 ${
    isActive 
      ? 'text-white shadow-2xl' 
      : 'bg-[#3A3A52] text-gray-300 hover:bg-[#4A4A62]'
  }`}
  style={isActive ? { 
    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', 
    fontFamily: 'Oswald, sans-serif' 
  } : { 
    fontFamily: 'Oswald, sans-serif' 
  }}
>
  Button Text
</button>
```

---

## 🌓 Dark Mode

### Background Colors
- Light: `bg-gray-50` (#F9FAFB)
- Dark: `bg-black` (#000000)

### Card Colors
- Light: `bg-white` (#FFFFFF)
- Dark: `bg-gray-800` (#1F2937)

### Text Colors
- Primary Light: `text-gray-900`
- Primary Dark: `text-white`
- Secondary Light: `text-gray-600`
- Secondary Dark: `text-gray-400`

### Border Colors
- Light: `border-gray-200`
- Dark: `border-gray-700`

**Always use dark mode classes:**
```jsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

---

## 🎭 Animations & Transitions

### Standard Transitions
```css
transition-all duration-300
```

### Hover Effects
```css
/* Scale Up */
transform hover:scale-105

/* Opacity Change */
hover:opacity-90

/* Shadow Increase */
hover:shadow-xl / hover:shadow-2xl

/* Combined */
className="transform hover:scale-105 hover:opacity-90 transition-all duration-300"
```

### Carousel Animations
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Applied with staggered delay */
animation: slideIn 0.5s ease-out ${index * 0.1}s both;
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Responsive Patterns
```jsx
{/* Mobile-first approach */}
className="text-base sm:text-lg md:text-xl"
className="px-4 sm:px-6 lg:px-8"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

{/* Conditional rendering */}
<div className="block md:hidden">{/* Mobile only */}</div>
<div className="hidden md:block">{/* Desktop only */}</div>
```

---

## 🔧 Utility Patterns

### Container
```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Section Spacing
```jsx
<section className="py-12 sm:py-16 lg:py-20">
  {/* Content */}
</section>
```

### Card Shadow
```css
/* Default */
shadow-md

/* Hover */
hover:shadow-xl

/* CTA/Important */
shadow-2xl
```

### Rounded Corners
- Small: `rounded` (4px)
- Medium: `rounded-md` (6px) - **Use for CTA buttons**
- Large: `rounded-lg` (8px)
- Extra Large: `rounded-xl` (12px) - Use for cards
- 2X Large: `rounded-2xl` (16px) - Use for large cards/sections
- Full: `rounded-full` - Use for badges/pills only

---

## 🎨 Gradient Patterns

### Primary CTA Gradient
```css
background: linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%);
```

### Card Gradient (Upcoming Events)
```css
background: linear-gradient(to bottom right, #FBCFE8, #DDD6FE, #BFDBFE);
/* Tailwind: bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 */
```

### Hero/Banner Gradient
```css
background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
```

---

## 🌐 Social Sharing Colors

### Platform-Specific
- **WhatsApp**: `#25D366` (Green)
- **Instagram**: Gradient `#E1306C` to `#F77737`
- **Twitter/X**: `#1DA1F2` (Blue)
- **Facebook**: `#1877F2` (Blue)

---

## ✅ Best Practices

### DO:
✅ Use Oswald for all headings (H1, H2, H3)  
✅ Use Source Serif Pro for subheadings, descriptions, and body text  
✅ Use `rounded-md` for CTA buttons (NOT `rounded-full`)  
✅ Apply the gradient with `linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)`  
✅ Include hover effects: `hover:scale-105 hover:opacity-90`  
✅ Use `shadow-2xl` for active/primary buttons  
✅ Use `#3A3A52` for default/inactive button background  
✅ Always provide dark mode alternatives  
✅ Use mobile-first responsive design  
✅ Include smooth transitions (`transition-all duration-300`)  

### DON'T:
❌ Don't use `rounded-full` for CTA buttons  
❌ Don't use different gradients for primary CTAs  
❌ Don't mix font families (stick to Oswald/Source Serif Pro)  
❌ Don't use inconsistent button padding  
❌ Don't forget responsive breakpoints  
❌ Don't use `gray-800` for inactive buttons (use `#3A3A52`)  
❌ Don't skip hover states and transitions  
❌ Don't use inline styles when Tailwind classes are available  

---

## 📦 Component Library Reference

### Primary CTA Button
```jsx
<button 
  className="text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
  style={{ 
    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', 
    fontFamily: 'Oswald, sans-serif' 
  }}
>
  Button Text
</button>
```

### Inactive Button
```jsx
<button 
  className="bg-[#3A3A52] text-gray-300 hover:bg-[#4A4A62] px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300"
  style={{ fontFamily: 'Oswald, sans-serif' }}
>
  Button Text
</button>
```

### Page Heading
```jsx
<h1 
  className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white" 
  style={{ fontFamily: 'Oswald, sans-serif' }}
>
  Page Title
</h1>
```

### Subheading
```jsx
<p 
  className="text-gray-600 dark:text-gray-400 text-base sm:text-lg" 
  style={{ fontFamily: 'Source Serif Pro, serif' }}
>
  Description text
</p>
```

### FAQ Section (Accordion)
```jsx
<section className="py-16 bg-black">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 
      className="text-3xl sm:text-4xl font-bold mb-2 text-center"
      style={{ fontFamily: 'Oswald, sans-serif' }}
    >
      Frequently Asked <span className="text-[#6366F1]" style={{ fontStyle: 'italic' }}>Questions</span>
    </h2>
    <p 
      className="text-gray-400 text-center mb-12 font-bold"
      style={{ fontFamily: 'Source Serif Pro, serif' }}
    >
      Subtitle text here
    </p>

    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className={`rounded-xl overflow-hidden transition-all ${
            openFAQ === index
              ? 'bg-gradient-to-br from-[#6366F1] to-[#4F46E5] border-0'
              : 'bg-transparent border-2 border-white/20'
          }`}
        >
          <button
            onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
            className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
          >
            <span 
              className="font-semibold text-lg"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              {faq.question}
            </span>
            <ChevronDown 
              className={`h-5 w-5 text-white flex-shrink-0 ml-4 transition-transform ${
                openFAQ === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {openFAQ === index && (
            <div 
              className="px-6 pb-5"
              style={{ fontFamily: 'Source Serif Pro, serif' }}
            >
              <p className="text-white leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</section>
```

**FAQ Key Properties:**
- Collapsed: `bg-transparent border-2 border-white/20`
- Expanded: `bg-gradient-to-br from-[#6366F1] to-[#4F46E5]`
- Border Radius: `rounded-xl`
- Padding: `px-6 py-5` for button, `px-6 pb-5` for answer
- Icon: ChevronDown with `rotate-180` when expanded
- Title Color: `text-[#6366F1]` with `italic` style for "Questions" word
- Font: Oswald for questions, Source Serif Pro for answers

---

## 🔄 Version History
- **v1.0** (January 2026): Initial style guide created
- Standardized button colors, typography, and component patterns

---

**Last Updated**: January 30, 2026  
**Maintained By**: IndulgeOut Development Team
