# Layered Cards Chat UI System

## Overview
The nutrition bot now features a modern **Layered Cards** UI design with stacking animations, glass morphism effects, and dual theme support.

## Components

### 1. **ChatCard.tsx**
- Individual message card with Framer Motion animations
- **Stacking Effects**: Cards stack with progressive scale, opacity, and y-offset
  - `scale = 1 - (position * 0.03)` → deeper cards are slightly smaller
  - `opacity = 1 - (position * 0.1)` → deeper cards fade
  - `yOffset = position * 12` → creates vertical stacking depth
- **Hover Effects**: Cards lift and tilt on hover for 3D feel
- **Perspective Transforms**: Uses `perspective(800px)` for depth

### 2. **ChatInput.tsx**
- Glass morphism input bar with neon send button
- **Focus Animation**: Input expands on focus with smooth transition
- **Enter Key Support**: Press Enter to send message
- **SVG Send Icon**: Animated send arrow icon

### 3. **LayeredChat.tsx**
- Main container managing message state and API calls
- **AnimatePresence**: Smooth enter/exit animations for cards
- **Greeting Detection**: Recognizes greetings to trigger avatar wave
- **Calorie Extraction**: Parses bot responses for calorie data to trigger hologram
- **see  Integration**: Calls nutrition bot API on port 3001

### 4. **ThemeToggle.tsx**
- Switch between **Neon** and **Medical** themes
- Motion-animated buttons with hover/tap effects
- Syncs with CSS custom properties

## Themes

### Neon Theme (Default)
- Dark backgrounds with gradient overlays
- Cyan/purple neon glows
- High contrast for visibility
- Futuristic aesthetic

### Medical Theme
- Light, clean background
- Blue accent colors (#007acc)
- Professional appearance
- Lower contrast for comfort

## Styling

All styles are in `/styles/layered-chat.css` using CSS custom properties:
- `--neon-*` variables for dark theme
- `--medical-*` variables for light theme
- `.theme-neon` and `.theme-medical` classes

## Features

✅ **Stacking Depth**: Up to 3 visible cards with progressive scaling  
✅ **Glass Morphism**: Backdrop blur on cards and input  
✅ **Smooth Animations**: Exit/enter animations with Framer Motion  
✅ **Hover Effects**: Interactive card lift and tilt  
✅ **Dual Themes**: Neon (dark) and Medical (light)  
✅ **API Integration**: Full backend communication maintained  
✅ **Calorie Detection**: Triggers VRM hologram display  
✅ **Wave Animation**: Greeting detection triggers avatar wave  

## Integration with Hologram

When LayeredChat detects calories in a bot response:
1. Extracts calorie value using regex
2. Calls `onCaloriesDetected(calories, foodName)` callback
3. Page.tsx updates `calorieData` state
4. VRMAvatar receives updated props
5. Hologram displays on avatar's left hand with nutrition-based color

## Theme Variables

```css
/* Neon Theme */
--neon-bg: rgba(10, 10, 30, 0.95)
--neon-card-bg: rgba(15, 15, 45, 0.8)
--neon-primary: #00ffff
--neon-secondary: #ff00ff

/* Medical Theme */
--medical-bg: rgba(240, 248, 255, 0.95)
--medical-card-bg: rgba(255, 255, 255, 0.9)
--medical-primary: #007acc
--medical-secondary: #00a8e8
```

## Usage

The LayeredChat component is used in `page.tsx`:

```tsx
<LayeredChat
  onTypingChange={setIsTyping}
  onGreeting={handleGreeting}
  onCaloriesDetected={handleCaloriesDetected}
/>
```

Toggle theme with:
```tsx
<ThemeToggle currentTheme={theme} onThemeChange={setTheme} />
```
