# 🚀 Visual Wizard - Quick Start Guide

## Get Started in 5 Minutes

This guide will help you test the new visual wizard immediately.

---

## Step 1: Install Dependencies

```bash
# Make sure all dependencies are installed
npm install

# Start the development server
npm run dev
```

The app should open at `http://localhost:8080`

---

## Step 2: Test the Visual Wizard

### **Full Test Flow (2 minutes):**

1. **Landing Page**
   - Go to `http://localhost:8080`
   - Click "Start Your Journey" button

2. **Authentication**
   - If not logged in, sign in or create an account
   - After login, you'll see the **Choice Modal**

3. **Choice Modal**
   - You should see two options:
     - ⚡ **Quick Visual Setup** (Recommended)
     - 💬 **Chat with AI**
   - Click "Quick Visual Setup"

4. **Screen 1: Location** (30 seconds)
   - Select your province (e.g., "ON" for Ontario)
   - Type or select your city (e.g., "Toronto")
   - Click "Continue"

5. **Screen 2: Industry Swiper** (30 seconds)
   - You'll see a card stack with industries
   - Swipe right (or click 👍) on 2-3 industries you like
   - Or swipe left (or click 👎) to pass
   - After selecting at least 1, you can click "Skip to next step"

6. **Screen 3: Resources** (30 seconds)
   - Move the budget slider (e.g., $5,000)
   - Click a time commitment card (e.g., "Part-Time")
   - Move the income goal slider (e.g., $5,000/month)
   - Click "Generate My Business Ideas ✨"

7. **Generating Screen** (10 seconds)
   - You'll see an animated loading screen
   - The app will create business ideas

8. **Results Page**
   - You should land on `/results` with your generated ideas
   - ✅ **Success!**

---

## Step 3: Quick Checks

### **Visual Check:**
- [ ] Progress bar shows at top of wizard
- [ ] Province cards are in a grid
- [ ] Selected province has a colored border
- [ ] Industry cards show emoji, name, stats
- [ ] Swipe animations work smoothly
- [ ] Sliders move smoothly
- [ ] Business examples update with budget
- [ ] Loading animation appears

### **Interaction Check:**
- [ ] Can't continue Screen 1 without province + city
- [ ] Can't skip Screen 2 without selecting at least 1 industry
- [ ] Back button works (on Screens 2 & 3)
- [ ] Exit button (X) returns to landing page
- [ ] "Continue" buttons work on each screen

### **Navigation Check:**
- [ ] URL changes to `/wizard` when starting
- [ ] Progress bar updates (33% → 66% → 100%)
- [ ] Final redirect to `/results` works
- [ ] Ideas are shown on results page

---

## Common Issues & Fixes

### Issue: "Module not found: Progress"
**Fix:**
```bash
npx shadcn-ui@latest add progress
```

### Issue: "Module not found: Dialog"
**Fix:**
```bash
npx shadcn-ui@latest add dialog
```

### Issue: Choice Modal doesn't appear
**Fix:**
- Make sure you're logged in
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`

### Issue: Ideas don't generate
**Fix:**
- Check Supabase connection in `.env`
- Verify `ft_generate_ideas` edge function exists
- Check browser console for API errors

### Issue: Swipe doesn't work
**Fix:**
- Try clicking the thumbs up/down buttons instead
- Check if drag events are working (try on desktop first)
- Test on a different browser

---

## Testing on Mobile

### **iOS (iPhone/iPad):**
1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Visit `http://YOUR_IP:8080` on your iPhone
3. Or use Chrome DevTools device emulation:
   - Press F12
   - Click device icon (Toggle device toolbar)
   - Select "iPhone 12 Pro"

### **Android:**
1. Same as iOS - use your local IP
2. Or use Chrome DevTools with Pixel 6 emulation

### **What to Test:**
- [ ] Tap targets are easy to hit
- [ ] Swipe gestures feel natural
- [ ] No horizontal scrolling
- [ ] Text is readable
- [ ] Buttons are large enough
- [ ] Keyboard doesn't cover inputs

---

## Development Mode Features

### **Hot Reload:**
- Edit any component file
- Changes appear instantly (no refresh needed)

### **React DevTools:**
- Install React DevTools browser extension
- Inspect component state
- View props and hooks

### **Console Logging:**
- Open browser console (F12)
- Look for analytics events:
  - `wizard_started`
  - `wizard_step_completed`
  - `ideas_generation_started`

---

## File Structure

```
src/
├── components/
│   ├── wizard/
│   │   ├── LocationSelector.tsx      ← Screen 1
│   │   ├── IndustrySwiper.tsx        ← Screen 2
│   │   └── ResourceSelector.tsx      ← Screen 3
│   └── landing/
│       └── OnboardingChoiceModal.tsx ← Choice dialog
├── pages/
│   ├── VisualWizard.tsx              ← Main container
│   └── Index.tsx                     ← Landing page (updated)
└── data/
    └── industries.ts                  ← Industry data
```

---

## Quick Customization

### **Change Industry Order:**
Edit `src/data/industries.ts` - reorder the array

### **Add More Industries:**
Add a new object to the `industries` array in `src/data/industries.ts`

### **Change Budget Range:**
In `ResourceSelector.tsx`, find the Slider component:
```typescript
<Slider min={0} max={100000} step={500} />
//        ↑ Change these values
```

### **Change Time Options:**
In `ResourceSelector.tsx`, edit `timeCommitmentOptions` array

### **Customize Colors:**
Edit `src/index.css` - update CSS variables:
```css
--primary: 221.2 83.2% 53.3%;  /* Change hue/saturation/lightness */
```

---

## Analytics Events

The wizard tracks these events automatically:

```typescript
// When wizard starts
track("wizard_started", { user_id })

// After each screen
track("wizard_step_completed", {
  step: "location" | "industries" | "resources",
  data: {...}
})

// When user goes back
track("wizard_back_clicked", { from_step })

// When user exits
track("wizard_exited", { at_step })

// When generating ideas
track("ideas_generation_started", { source: "visual_wizard" })

// On success
track("ideas_generated", { session_id, count })

// On choice
track("onboarding_choice", { choice: "wizard" | "chat" })
```

Check these events in your analytics dashboard to monitor usage.

---

## Next Steps After Testing

1. **Works Great?**
   - Read [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for full launch plan
   - Follow Phase 2+ to add polish

2. **Found Bugs?**
   - Note the error message
   - Check browser console
   - Try the fix in "Common Issues" section
   - Document for team

3. **Want to Customize?**
   - Edit industry data in `src/data/industries.ts`
   - Adjust colors in `src/index.css`
   - Modify copy/text directly in component files

---

## Getting Help

**Documentation:**
- [VISUAL_WIZARD_IMPLEMENTATION.md](VISUAL_WIZARD_IMPLEMENTATION.md) - Technical details
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Full rollout plan

**Testing:**
- Test on Chrome, Firefox, Safari
- Test on real mobile devices
- Use React DevTools for debugging

**Deployment:**
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Happy Testing! 🎉**

The wizard should provide a much faster, more engaging experience than the chat flow. Enjoy!
