# Visual Wizard Testing Checklist

## ✅ Pre-Test Verification

All implementation files are in place and ready for testing:

### **Components Created** ✅
- [x] `src/data/industries.ts` - 15 industries with gradient backgrounds
- [x] `src/components/wizard/LocationSelector.tsx` - Province & city selector
- [x] `src/components/wizard/IndustrySwiper.tsx` - Swipeable industry cards
- [x] `src/components/wizard/ResourceSelector.tsx` - Budget/time/income sliders
- [x] `src/pages/VisualWizard.tsx` - Main wizard container
- [x] `src/components/landing/OnboardingChoiceModal.tsx` - Choice modal

### **Integration Points** ✅
- [x] Route added to `src/App.tsx` at line 94-100
- [x] Choice modal integrated in `src/pages/Index.tsx`
- [x] All dependencies installed (React, Framer Motion, Supabase, etc.)

### **Documentation Created** ✅
- [x] VISUAL_WIZARD_IMPLEMENTATION.md
- [x] IMPLEMENTATION_PLAN.md
- [x] QUICKSTART.md
- [x] IMPLEMENTATION_COMPLETE.md
- [x] COMPETITIVE_STRATEGY.md

---

## 🧪 Testing Instructions

### **Step 1: Start Development Server**

```bash
cd "c:\Users\alija\OneDrive\Documents\GitHub\spark-business-buddy-main"
npm run dev
```

Expected: Server starts at `http://localhost:8080`

---

### **Step 2: Test Landing Page → Auth → Choice Modal**

1. **Visit Landing Page**
   - [ ] Go to `http://localhost:8080`
   - [ ] Verify hero section loads
   - [ ] Click "Start Your Journey" button

2. **Authentication Flow**
   - [ ] If not logged in, redirects to `/auth`
   - [ ] Sign in or create test account
   - [ ] After login, returns to landing

3. **Choice Modal Appears**
   - [ ] Modal shows two options:
     - ⚡ Quick Visual Setup (90 seconds) - Recommended
     - 💬 Chat with AI (5-7 minutes)
   - [ ] Click "Quick Visual Setup"
   - [ ] Navigates to `/wizard`

---

### **Step 3: Test Screen 1 - Location Selector**

**Visual Checks:**
- [ ] Progress bar shows at top (33%)
- [ ] "Step 1 of 3: Location" text visible
- [ ] 13 province cards displayed in grid
- [ ] Province cards show abbreviation + full name
- [ ] City input field visible
- [ ] Popular cities shown as suggestion buttons

**Interaction Tests:**
- [ ] Click a province card (e.g., "ON - Ontario")
- [ ] Selected card shows primary border/ring
- [ ] Type a city name (e.g., "Toronto")
- [ ] Click a popular city suggestion
- [ ] "Continue" button enables only when both selected
- [ ] Click "Continue"
- [ ] Smooth transition to Screen 2

**Browser Console:**
- [ ] Check for analytics event: `wizard_step_completed` with `step: "location"`
- [ ] No errors in console

---

### **Step 4: Test Screen 2 - Industry Swiper**

**Visual Checks:**
- [ ] Progress bar updates to 66%
- [ ] "Step 2 of 3: Interests" text visible
- [ ] Back button appears in header
- [ ] Industry card stack visible
- [ ] Card shows:
  - [ ] Large emoji icon
  - [ ] Industry name
  - [ ] Description
  - [ ] Gradient background (CSS gradient, not image)
  - [ ] Stats grid (startup cost, growth rate, time to launch)
  - [ ] Demand score
  - [ ] Competition level
  - [ ] 3 example businesses
- [ ] Thumbs up/down buttons visible
- [ ] Progress counter (e.g., "1/15")

**Interaction Tests:**
- [ ] Click thumbs up (👍) - card swipes right and disappears
- [ ] Next card appears smoothly
- [ ] Click thumbs down (👎) - card swipes left
- [ ] Try dragging card to the right (swipe)
- [ ] Try dragging card to the left (swipe)
- [ ] After selecting 1+ industries, "Skip to next step" button appears
- [ ] Selected count badge shows (e.g., "3 selected")
- [ ] Click through 3-5 industries
- [ ] Click "Continue" or "Skip to next step"
- [ ] Smooth transition to Screen 3

**Back Button Test:**
- [ ] Click "Back" button
- [ ] Returns to Screen 1 (Location)
- [ ] Previous selections preserved
- [ ] Navigate forward again

**Browser Console:**
- [ ] Check for analytics: `wizard_step_completed` with `step: "industries"`
- [ ] Event includes selected industry IDs

---

### **Step 5: Test Screen 3 - Resource Selector**

**Visual Checks:**
- [ ] Progress bar shows 100%
- [ ] "Step 3 of 3: Resources" text visible
- [ ] Three sections visible:
  1. Budget slider
  2. Time commitment cards
  3. Income goal slider
- [ ] All sections in single scrollable view

**Budget Section:**
- [ ] Slider moves smoothly ($0 - $100K)
- [ ] Current value displays (e.g., "$5,000")
- [ ] 3 business example cards update based on budget
- [ ] Examples show emoji + name
- [ ] Try different budget ranges:
  - [ ] $0 - $1K (shows Freelancing, Social Media)
  - [ ] $1K - $5K (shows Online Store, Consulting)
  - [ ] $5K - $20K (shows Food Truck, Mobile Service)
  - [ ] $20K+ (shows Franchise, Retail Store)

**Time Commitment Section:**
- [ ] 4 cards displayed:
  - 🌙 Side Hustle (5-10 hrs/week)
  - ⏰ Part-Time (20-30 hrs/week)
  - 💼 Full-Time (40+ hrs/week)
  - 🚀 All In (60+ hrs/week)
- [ ] Cards are clickable
- [ ] Selected card shows primary background
- [ ] Only one can be selected at a time

**Income Goal Section:**
- [ ] Slider moves smoothly ($1K - $25K/month)
- [ ] Current value displays (e.g., "$5,000/month")
- [ ] Annual projection shows (e.g., "$60,000/year")
- [ ] Lifestyle description card updates based on income:
  - [ ] Under $3K: "Cover basic expenses"
  - [ ] $3K-$7K: "Comfortable living"
  - [ ] $7K-$15K: "Financial freedom"
  - [ ] $15K+: "Wealth building"

**Continue Button:**
- [ ] "Generate My Business Ideas ✨" button visible
- [ ] Button has gradient background
- [ ] Button enabled after selecting all three inputs
- [ ] Click button

---

### **Step 6: Test Screen 4 - Generating**

**Visual Checks:**
- [ ] Smooth transition to generating screen
- [ ] Animated sparkle emoji (✨) rotating and scaling
- [ ] "Generating Your Business Ideas" heading
- [ ] Context message shows city/province (e.g., "...in Toronto, ON...")
- [ ] Three pulsing dots animation
- [ ] Loading screen shows for 5-15 seconds

**Browser Console:**
- [ ] Check for analytics: `ideas_generation_started` with `source: "visual_wizard"`
- [ ] Check for Supabase network calls:
  - [ ] POST to `/chat_sessions` (creates session)
  - [ ] POST to `/functions/v1/ft_generate_ideas`
- [ ] No errors during generation

**Success Path:**
- [ ] Toast notification appears: "Generated X business ideas!"
- [ ] Analytics event: `ideas_generated` with session_id and count
- [ ] Auto-redirects to `/results` page
- [ ] Results page shows generated ideas

**Error Path (if applicable):**
- [ ] If error occurs, shows toast: "Failed to generate ideas"
- [ ] Returns to Screen 3 (Resources)
- [ ] Analytics event: `ideas_generation_failed` with error message

---

### **Step 7: Test Exit & Back Functionality**

**Exit Button (X):**
- [ ] Click X button from Screen 1
- [ ] Navigates back to landing page (`/`)
- [ ] Analytics: `wizard_exited` with `at_step: "location"`
- [ ] Try again, exit from Screen 2
- [ ] Exit from Screen 3

**Back Button:**
- [ ] From Screen 2, click Back → returns to Screen 1
- [ ] From Screen 3, click Back → returns to Screen 2
- [ ] All previous selections preserved
- [ ] Progress bar updates correctly
- [ ] Analytics: `wizard_back_clicked` with `from_step`

---

### **Step 8: Mobile Responsiveness Test**

**Chrome DevTools Mobile Emulation:**
1. Press F12 → Click device icon → Select "iPhone 12 Pro"

**Mobile Layout Checks:**
- [ ] Province grid shows 2 columns (not 4)
- [ ] City input full width
- [ ] Industry cards stack properly
- [ ] Swipe gestures work with touch simulation
- [ ] Budget/income sliders work with touch
- [ ] Time commitment cards stack vertically
- [ ] All text readable (no tiny fonts)
- [ ] Buttons large enough to tap (48px minimum)
- [ ] No horizontal scrolling
- [ ] Header sticky and responsive

**Test on Real Device (if available):**
- [ ] Get local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- [ ] Visit `http://YOUR_IP:8080` on mobile
- [ ] Test touch interactions
- [ ] Test swipe gestures
- [ ] Verify keyboard doesn't cover inputs

---

### **Step 9: Browser Compatibility**

**Chrome:**
- [ ] Full flow works end-to-end
- [ ] Animations smooth
- [ ] No console errors

**Firefox:**
- [ ] Full flow works
- [ ] Gradient backgrounds render correctly
- [ ] Framer Motion animations work

**Safari (if available):**
- [ ] Test on macOS Safari or iOS Safari
- [ ] Verify backdrop-filter works
- [ ] Check gradient rendering

**Edge:**
- [ ] Full flow works
- [ ] All features functional

---

### **Step 10: Analytics Verification**

**Check Browser Console for all events:**
1. [ ] `wizard_started` - when wizard loads
2. [ ] `wizard_step_completed` (location) - after Screen 1
3. [ ] `wizard_step_completed` (industries) - after Screen 2
4. [ ] `wizard_step_completed` (resources) - after Screen 3
5. [ ] `ideas_generation_started` - before API call
6. [ ] `ideas_generated` - after success
7. [ ] `onboarding_choice` - when choosing wizard vs chat

**Optional: Check in actual analytics dashboard (if configured)**

---

## 🐛 Known Issues to Verify

1. **Industry Images:**
   - [ ] Confirm gradients render (not broken image placeholders)
   - Expected: CSS linear-gradient backgrounds with emoji overlay

2. **City Suggestions:**
   - [ ] City autocomplete uses hardcoded suggestions (not API)
   - Expected: Popular cities shown for each province

3. **Budget Validation:**
   - [ ] Users can set any value ($0 - $100K)
   - Note: No min/max warnings currently

4. **Session Resume:**
   - [ ] Exiting wizard loses progress
   - Note: No localStorage save currently

---

## ✅ Success Criteria

**Minimum Viable Test (5 minutes):**
- ✅ Complete full flow from landing → results
- ✅ No critical errors in console
- ✅ All 3 screens display correctly
- ✅ Ideas generate successfully
- ✅ Redirects to results page

**Complete Test (15 minutes):**
- ✅ All interaction tests pass
- ✅ Back/Exit buttons work
- ✅ Mobile responsive
- ✅ Analytics tracking works
- ✅ Error handling works (if API fails)

**Production Ready:**
- ✅ Tested on 3+ browsers
- ✅ Tested on real mobile device
- ✅ No console errors
- ✅ All analytics events firing
- ✅ Smooth animations (60fps)
- ✅ All gradients render correctly

---

## 🚀 Next Steps After Testing

**If Everything Works:**
1. Review [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for Phase 2+
2. Set up A/B testing (wizard vs chat)
3. Monitor completion rates
4. Gather user feedback

**If Issues Found:**
1. Document specific error messages
2. Note which browser/device
3. Check Supabase edge function logs
4. Review browser console errors
5. Test with different user accounts

**Enhancements to Consider:**
- Review [COMPETITIVE_STRATEGY.md](COMPETITIVE_STRATEGY.md) for 18 strategic improvements
- Implement real industry images
- Add city autocomplete API
- Add "Save & Resume Later"
- Implement A/B testing

---

## 📞 Support Resources

**Documentation:**
- [VISUAL_WIZARD_IMPLEMENTATION.md](VISUAL_WIZARD_IMPLEMENTATION.md) - Technical details
- [QUICKSTART.md](QUICKSTART.md) - Quick 5-minute guide
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Full rollout plan
- [COMPETITIVE_STRATEGY.md](COMPETITIVE_STRATEGY.md) - Feature roadmap

**Common Commands:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Debugging Tips:**
- Check Network tab for Supabase API calls
- Verify `ft_generate_ideas` edge function is deployed
- Check `.env` file for correct Supabase credentials
- Use React DevTools to inspect component state

---

## 📊 Testing Summary Template

Use this template to document your test results:

```
## Visual Wizard Test Results

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Development/Production]
**Browser:** [Chrome/Firefox/Safari/Edge + Version]
**Device:** [Desktop/Mobile/Tablet + OS]

### Results:
- [ ] Landing page → Choice modal: PASS / FAIL
- [ ] Screen 1 (Location): PASS / FAIL
- [ ] Screen 2 (Industries): PASS / FAIL
- [ ] Screen 3 (Resources): PASS / FAIL
- [ ] Screen 4 (Generating): PASS / FAIL
- [ ] Results page: PASS / FAIL

### Time to Complete:
- Start time: [HH:MM]
- End time: [HH:MM]
- Total duration: [X minutes]

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
[Any additional observations]
```

---

**Ready to test! 🎉**

Follow the steps above in order for a complete test of the visual wizard flow.
