# 🚀 Visual Wizard - Complete Implementation Plan

## Executive Summary

This document outlines the complete implementation plan to update the SPARK Business Buddy app with the new visual wizard onboarding flow. The plan is divided into phases with clear priorities and success metrics.

---

## 📋 Phase 1: Core Fixes & Dependencies (Day 1)

### **Priority: P0 (Critical - Must Have)**

#### 1.1 Fix Missing UI Components
**Status:** 🔴 Blocking
**Time:** 30 minutes

**Issues:**
- `Progress` component may not exist
- `Dialog` component needs verification
- Ensure all shadcn/ui components are installed

**Actions:**
```bash
# Install missing components
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add dialog

# Verify installation
npm run dev
```

**Validation:**
- [ ] Wizard loads without errors
- [ ] Progress bar renders correctly
- [ ] Modal opens/closes smoothly

---

#### 1.2 Fix TypeScript Errors
**Status:** 🔴 Blocking
**Time:** 1 hour

**Actions:**
- Run `npm run build` to find type errors
- Fix any missing type definitions
- Ensure all imports are correct

**Known Issues to Fix:**
1. `FTExtractedData` type compatibility
2. Supabase function response types
3. Navigation state types

---

#### 1.3 Test Core Wizard Flow
**Status:** 🔴 Blocking
**Time:** 1 hour

**Test Checklist:**
- [ ] Landing page → Choice modal appears
- [ ] "Quick Visual Setup" → Navigates to /wizard
- [ ] Screen 1: Can select province and city
- [ ] Screen 1 → Screen 2 transition works
- [ ] Screen 2: Can swipe cards (left/right)
- [ ] Screen 2: Counter updates correctly
- [ ] Screen 2 → Screen 3 transition works
- [ ] Screen 3: Sliders work smoothly
- [ ] Screen 3: Examples update based on budget
- [ ] "Generate Ideas" → Loading state appears
- [ ] Ideas are created in database
- [ ] Navigation to /results with session ID
- [ ] Results page displays generated ideas

**Critical Path Test:**
```
/                     [Landing]
  → Click "Start"
  → Login
  → Choose "Wizard"
  → /wizard           [Screen 1]
  → Select ON + Toronto
  → Continue
  → [Screen 2]
  → Swipe 3 industries
  → Continue
  → [Screen 3]
  → Set budget: $5000
  → Set time: Part-Time
  → Set income: $5000
  → Generate Ideas
  → /results          [Ideas displayed]
```

---

## 📋 Phase 2: Visual Assets & Polish (Day 2)

### **Priority: P1 (High - Should Have)**

#### 2.1 Add Industry Hero Images
**Status:** 🟡 Important
**Time:** 2 hours

**Current State:**
- All industries use `/placeholder.svg`

**Actions:**
1. **Option A: Use Free Stock Photos**
   - Source from Unsplash, Pexels, or Pixabay
   - 15 high-quality images (1200x800px)
   - Compress for web (under 200KB each)

2. **Option B: Use AI-Generated Images**
   - Generate with DALL-E or Midjourney
   - Consistent style across all industries
   - Royalty-free for commercial use

3. **Option C: Use Gradient Backgrounds**
   - Create unique gradients per industry
   - Add icons/patterns
   - Fastest option, smallest file size

**Recommended:** Option C for MVP, upgrade to Option A later

**Implementation:**
```typescript
// Update industries.ts
export const industries: Industry[] = [
  {
    id: "digital-services",
    name: "Digital Services",
    // Replace with actual gradient
    heroImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    // Or use image URL
    heroImage: "https://images.unsplash.com/photo-...",
    // ...
  },
];
```

**Image Checklist:**
- [ ] Digital Services: Laptop/coding theme
- [ ] Local Services: Home/tools theme
- [ ] E-Commerce: Shopping/packages theme
- [ ] Food & Beverage: Food/restaurant theme
- [ ] Health & Wellness: Fitness/yoga theme
- [ ] Creative & Arts: Art/design theme
- [ ] Education & Training: Books/learning theme
- [ ] Trades & Repair: Tools/construction theme
- [ ] Tech & Software: Technology/innovation theme
- [ ] Childcare & Senior: Care/family theme
- [ ] Automotive: Cars/vehicles theme
- [ ] Real Estate: Houses/buildings theme
- [ ] Pet Services: Dogs/cats/pets theme
- [ ] Events & Entertainment: Party/celebration theme
- [ ] Green & Sustainable: Nature/eco theme

---

#### 2.2 Enhance Visual Feedback
**Status:** 🟡 Important
**Time:** 1 hour

**Actions:**
1. Add confetti animation on wizard completion
2. Add haptic feedback (vibration) on mobile
3. Improve loading animations
4. Add success checkmarks after each screen

**Implementation:**
```typescript
// Use existing canvas-confetti
import confetti from 'canvas-confetti';

const handleResourcesComplete = async (data) => {
  // Trigger confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  // Vibrate on mobile
  if (navigator.vibrate) {
    navigator.vibrate([50, 100, 50]);
  }

  // Continue with generation...
};
```

---

## 📋 Phase 3: Data Integration (Day 3)

### **Priority: P1 (High - Should Have)**

#### 3.1 City Autocomplete API
**Status:** 🟡 Important
**Time:** 2 hours

**Current State:**
- Hardcoded city arrays per province

**Options:**

**Option A: Use Canadian Cities API**
```typescript
// Free API: https://api.api-ninjas.com/v1/city
const fetchCitiesByProvince = async (provinceCode: string) => {
  const response = await fetch(
    `https://api.api-ninjas.com/v1/city?country=CA&limit=30`,
    {
      headers: { 'X-Api-Key': process.env.VITE_API_NINJAS_KEY }
    }
  );
  return response.json();
};
```

**Option B: Use Supabase Edge Function**
```sql
-- Create cities table
CREATE TABLE canadian_cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  province_code TEXT NOT NULL,
  population INTEGER,
  latitude DECIMAL,
  longitude DECIMAL
);

-- Seed with data from Statistics Canada
```

**Option C: Use Static JSON (Recommended for MVP)**
- Create `src/data/cities.ts` with all Canadian cities
- Import from Statistics Canada open data
- ~5000 cities, ~50KB gzipped

**Recommended:** Option C for speed, upgrade to Option B later

---

#### 3.2 Industry Trend Data
**Status:** 🟢 Nice to Have
**Time:** 3 hours

**Enhancement:**
- Show "Trending up 15% this month" on industry cards
- Fetch from real market data API
- Cache for 24 hours

**Implementation:**
```typescript
// Add to industries.ts
interface Industry {
  // ... existing fields
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastUpdated: string;
}

// Fetch trends from edge function
const { data: trends } = await supabase.functions.invoke('ft_fetch_industry_trends');
```

---

## 📋 Phase 4: User Experience Enhancements (Day 4)

### **Priority: P1 (High - Should Have)**

#### 4.1 Save & Resume Later
**Status:** 🟡 Important
**Time:** 2 hours

**Features:**
- Save wizard progress to localStorage
- Show "Resume from step 2" option on dashboard
- Clear saved data after completion

**Implementation:**
```typescript
// In VisualWizard.tsx
useEffect(() => {
  // Save progress on each step
  const wizardState = {
    currentStep,
    wizardData,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem('wizard_progress', JSON.stringify(wizardState));
}, [currentStep, wizardData]);

// On mount, check for saved progress
useEffect(() => {
  const saved = localStorage.getItem('wizard_progress');
  if (saved) {
    const { currentStep, wizardData, lastUpdated } = JSON.parse(saved);
    // Only restore if < 24 hours old
    const age = Date.now() - new Date(lastUpdated).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      // Show resume dialog
      setShowResumeDialog(true);
    }
  }
}, []);
```

**UI Components:**
- Resume dialog on wizard entry
- "Save & Exit" button in header
- Progress saved toast notification
- Dashboard card showing "Resume wizard (Step 2/3)"

---

#### 4.2 Keyboard Shortcuts
**Status:** 🟢 Nice to Have
**Time:** 1 hour

**Shortcuts:**
- `Escape` - Exit wizard (with confirmation)
- `Enter` - Continue to next screen
- `Backspace` - Go back one screen
- `Left Arrow` - Swipe left (in swiper)
- `Right Arrow` - Swipe right (in swiper)
- `1-9` - Quick select industries by number

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowExitConfirmation(true);
    }
    if (e.key === 'Enter' && canContinue) {
      handleContinue();
    }
    if (e.key === 'Backspace' && currentStep !== 'location') {
      e.preventDefault();
      handleBack();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentStep, canContinue]);
```

---

#### 4.3 Improved Error Handling
**Status:** 🟡 Important
**Time:** 1 hour

**Error Scenarios:**
1. Failed to generate ideas (API error)
2. Network disconnection mid-wizard
3. Invalid data entered
4. Session creation failure

**Implementation:**
```typescript
// Add error boundary
<ErrorBoundary
  fallback={<WizardErrorFallback onReset={handleReset} />}
>
  <VisualWizard />
</ErrorBoundary>

// Add retry logic
const generateIdeasWithRetry = async (data, retries = 3) => {
  try {
    return await generateIdeas(data);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateIdeasWithRetry(data, retries - 1);
    }
    throw error;
  }
};
```

**User-Facing Errors:**
- Clear error messages (no technical jargon)
- Actionable next steps ("Try again" button)
- Contact support link
- Error tracking (Sentry integration)

---

## 📋 Phase 5: Dashboard Integration (Day 5)

### **Priority: P1 (High - Should Have)**

#### 5.1 Update Dashboard CTA
**Status:** 🟡 Important
**Time:** 1 hour

**Current State:**
- Dashboard shows "Start Your First Session" → /chat

**New State:**
- Show choice: "Quick Wizard" vs "Chat with AI"
- Track which option users prefer
- Show recent wizard sessions

**Implementation:**
```typescript
// In Dashboard.tsx
<Card>
  <CardHeader>
    <CardTitle>Get Started</CardTitle>
    <CardDescription>
      Choose your preferred way to discover business ideas
    </CardDescription>
  </CardHeader>
  <CardContent className="grid md:grid-cols-2 gap-4">
    <Button
      size="lg"
      onClick={() => navigate('/wizard')}
      className="h-24 flex-col gap-2"
    >
      <Sparkles className="w-8 h-8" />
      <div>
        <div className="font-bold">Visual Wizard</div>
        <div className="text-xs opacity-80">90 seconds</div>
      </div>
    </Button>

    <Button
      size="lg"
      variant="outline"
      onClick={() => navigate('/chat')}
      className="h-24 flex-col gap-2"
    >
      <MessageSquare className="w-8 h-8" />
      <div>
        <div className="font-bold">AI Chat</div>
        <div className="text-xs opacity-80">5-7 minutes</div>
      </div>
    </Button>
  </CardContent>
</Card>
```

---

#### 5.2 Show Wizard Completion in Stats
**Status:** 🟢 Nice to Have
**Time:** 30 minutes

**Enhancement:**
- Add "Wizards completed" to dashboard stats
- Show average completion time
- Display completion rate

---

## 📋 Phase 6: A/B Testing Setup (Day 6)

### **Priority: P2 (Medium - Nice to Have)**

#### 6.1 Implement Experiment Framework
**Status:** 🟢 Nice to Have
**Time:** 2 hours

**Goal:**
Test wizard vs chat to measure:
- Completion rate
- Time to completion
- Ideas generated
- User satisfaction
- Conversion to paid

**Implementation:**
```typescript
// Use existing useExperiments hook
const { getVariant, trackConversion } = useExperiments();

// Define experiment
const onboardingVariant = getVariant('onboarding_mode', {
  variants: ['wizard', 'chat'],
  weights: [50, 50], // 50/50 split
});

// Auto-route based on variant
useEffect(() => {
  if (user && !hasCompletedOnboarding) {
    if (onboardingVariant === 'wizard') {
      navigate('/wizard');
    } else {
      navigate('/chat');
    }
  }
}, [user, onboardingVariant]);

// Track completion
track('onboarding_completed', {
  variant: onboardingVariant,
  duration_seconds: completionTime,
  ideas_generated: ideasCount,
});
```

**Metrics Dashboard:**
- Create admin page: `/app/admin/experiments`
- Show real-time A/B test results
- Calculate statistical significance
- Allow manual override

---

## 📋 Phase 7: Performance Optimization (Day 7)

### **Priority: P2 (Medium - Nice to Have)**

#### 7.1 Lazy Loading
**Status:** 🟢 Nice to Have
**Time:** 1 hour

**Implementation:**
```typescript
// Lazy load wizard screens
const LocationSelector = lazy(() =>
  import('@/components/wizard/LocationSelector')
);
const IndustrySwiper = lazy(() =>
  import('@/components/wizard/IndustrySwiper')
);
const ResourceSelector = lazy(() =>
  import('@/components/wizard/ResourceSelector')
);

// Prefetch next screen
useEffect(() => {
  if (currentStep === 'location') {
    import('@/components/wizard/IndustrySwiper');
  }
  if (currentStep === 'industries') {
    import('@/components/wizard/ResourceSelector');
  }
}, [currentStep]);
```

---

#### 7.2 Image Optimization
**Status:** 🟢 Nice to Have
**Time:** 1 hour

**Actions:**
- Compress all images to WebP format
- Use responsive images (srcset)
- Lazy load industry images
- Add blur-up placeholders

```typescript
// Use next/image style optimization
<img
  src={industry.heroImage}
  srcSet={`
    ${industry.heroImage}?w=400 400w,
    ${industry.heroImage}?w=800 800w,
    ${industry.heroImage}?w=1200 1200w
  `}
  loading="lazy"
  decoding="async"
/>
```

---

#### 7.3 Bundle Size Optimization
**Status:** 🟢 Nice to Have
**Time:** 2 hours

**Actions:**
1. Analyze bundle with `vite-bundle-visualizer`
2. Tree-shake unused UI components
3. Code-split by route
4. Remove duplicate dependencies

```bash
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

# Build and analyze
npm run build
```

**Target Metrics:**
- Initial bundle: < 200KB gzipped
- Wizard route: < 50KB gzipped
- Load time (3G): < 3 seconds

---

## 📋 Phase 8: Mobile Polish (Day 8)

### **Priority: P1 (High - Should Have)**

#### 8.1 Mobile Testing
**Status:** 🟡 Important
**Time:** 3 hours

**Test Devices:**
- [ ] iPhone 12/13/14 (iOS 16+)
- [ ] iPhone SE (small screen)
- [ ] Samsung Galaxy S21 (Android 12+)
- [ ] Google Pixel 6
- [ ] iPad (tablet)

**Test Scenarios:**
- [ ] Portrait mode works perfectly
- [ ] Landscape mode is usable
- [ ] Swipe gestures are smooth
- [ ] No layout shifts
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area padding works (notch)
- [ ] Touch targets are 48px minimum
- [ ] No horizontal scroll

---

#### 8.2 PWA Enhancements
**Status:** 🟢 Nice to Have
**Time:** 2 hours

**Features:**
- Show install prompt after wizard completion
- Offline support for wizard (save to localStorage)
- Add to home screen instructions
- Push notifications for abandoned wizards

---

## 📋 Phase 9: Accessibility (Day 9)

### **Priority: P1 (High - Should Have)**

#### 9.1 WCAG 2.1 AA Compliance
**Status:** 🟡 Important
**Time:** 3 hours

**Checklist:**
- [ ] All colors meet 4.5:1 contrast ratio
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] ARIA labels on all buttons/inputs
- [ ] Screen reader tested
- [ ] Skip navigation links
- [ ] Error messages are clear
- [ ] Form validation is accessible

**Tools:**
- axe DevTools browser extension
- WAVE accessibility checker
- Lighthouse accessibility audit

---

#### 9.2 Screen Reader Testing
**Status:** 🟡 Important
**Time:** 2 hours

**Test with:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac/iOS)
- TalkBack (Android)

**Ensure:**
- Progress is announced
- Screen changes are announced
- Cards have clear labels
- Sliders announce values
- Errors are read aloud

---

## 📋 Phase 10: Launch Preparation (Day 10)

### **Priority: P0 (Critical - Must Have)**

#### 10.1 Documentation
**Status:** 🔴 Blocking
**Time:** 2 hours

**Create:**
- [ ] User guide (How to use wizard)
- [ ] Admin guide (How to monitor metrics)
- [ ] Developer guide (How to extend)
- [ ] Troubleshooting guide
- [ ] FAQ section

---

#### 10.2 Analytics Setup
**Status:** 🔴 Blocking
**Time:** 2 hours

**Track:**
- Wizard started
- Each step completed
- Drop-off points
- Completion time
- Ideas generated
- Conversion to paid

**Tools:**
- Use existing `useTrackEvent` hook
- Create custom dashboard
- Set up alerts for anomalies

---

#### 10.3 Feature Flags
**Status:** 🟡 Important
**Time:** 1 hour

**Implementation:**
```typescript
// Add feature flag
const isWizardEnabled = useFeatureFlag('visual_wizard');

// Conditional rendering
{isWizardEnabled ? (
  <OnboardingChoiceModal ... />
) : (
  // Old behavior: direct to chat
  <Button onClick={() => navigate('/chat')}>Start</Button>
)}
```

**Benefits:**
- Quick rollback if issues arise
- Gradual rollout (10% → 50% → 100%)
- A/B testing control

---

## 📊 Success Metrics

### **Key Performance Indicators (KPIs)**

#### Primary Metrics:
1. **Completion Rate**
   - Target: 80%+ (vs 40% for chat)
   - Measure: (Wizard completed / Wizard started)

2. **Time to Value**
   - Target: < 2 minutes (vs 5-7 for chat)
   - Measure: Time from start to ideas generated

3. **User Satisfaction**
   - Target: 4.5/5 stars
   - Measure: Post-wizard survey

#### Secondary Metrics:
4. **Ideas Generated per User**
   - Target: Same as chat (5-10 ideas)

5. **Conversion to Paid**
   - Target: 5%+ within 7 days

6. **Mobile vs Desktop**
   - Track completion rates by device
   - Optimize for lower performer

---

## 🎯 Launch Checklist

### **Pre-Launch (T-1 week)**
- [ ] All P0 items completed
- [ ] All P1 items completed
- [ ] Code review completed
- [ ] QA testing passed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security review completed
- [ ] Documentation published
- [ ] Analytics configured
- [ ] Feature flag ready

### **Soft Launch (T-0)**
- [ ] Enable for 10% of users
- [ ] Monitor error rates
- [ ] Check completion metrics
- [ ] Gather user feedback
- [ ] Fix any critical bugs

### **Full Launch (T+3 days)**
- [ ] Increase to 50% of users
- [ ] Monitor A/B test results
- [ ] Compare wizard vs chat
- [ ] Optimize based on data

### **Post-Launch (T+7 days)**
- [ ] 100% rollout
- [ ] Publish success metrics
- [ ] Plan iteration 2
- [ ] Deprecate chat (optional)

---

## 🚨 Risk Mitigation

### **High Risk Items**

1. **API Failures**
   - Mitigation: Retry logic, fallback to chat
   - Monitoring: Alert on >5% failure rate

2. **Mobile Performance**
   - Mitigation: Extensive testing, lazy loading
   - Monitoring: Track load times by device

3. **User Confusion**
   - Mitigation: Clear instructions, tooltips
   - Monitoring: Track drop-off points

4. **Data Loss**
   - Mitigation: Auto-save to localStorage
   - Monitoring: Alert on session creation failures

---

## 📅 Timeline Summary

| Phase | Days | Priority | Status |
|-------|------|----------|--------|
| Phase 1: Core Fixes | 1 | P0 | 🔴 |
| Phase 2: Visual Assets | 1 | P1 | 🟡 |
| Phase 3: Data Integration | 1 | P1 | 🟡 |
| Phase 4: UX Enhancements | 1 | P1 | 🟡 |
| Phase 5: Dashboard Integration | 1 | P1 | 🟡 |
| Phase 6: A/B Testing | 1 | P2 | 🟢 |
| Phase 7: Performance | 1 | P2 | 🟢 |
| Phase 8: Mobile Polish | 1 | P1 | 🟡 |
| Phase 9: Accessibility | 1 | P1 | 🟡 |
| Phase 10: Launch Prep | 1 | P0 | 🔴 |

**Total: 10 days (~2 weeks with buffer)**

---

## 🎯 Next Immediate Steps

### **Today (Priority Order):**

1. ✅ **Fix UI Component Dependencies** (30 min)
   ```bash
   npx shadcn-ui@latest add progress
   npm run dev
   ```

2. ✅ **Test Core Flow** (1 hour)
   - Follow critical path test
   - Document any errors

3. ✅ **Add Industry Gradients** (1 hour)
   - Replace placeholder with gradients
   - Test visual appeal

4. ✅ **Implement Error Handling** (1 hour)
   - Add try/catch blocks
   - User-friendly error messages

5. ✅ **Add Confetti Celebration** (30 min)
   - Trigger on completion
   - Test on mobile

---

## 📞 Support & Questions

If you encounter issues:
1. Check browser console for errors
2. Review this implementation plan
3. Check VISUAL_WIZARD_IMPLEMENTATION.md
4. Test on different devices/browsers

---

**Ready to begin implementation! 🚀**

Let's start with Phase 1: Core Fixes.
