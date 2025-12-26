# Features Quick Reference Guide

## 🚀 New Features & How to Use Them

### 1. Safe JSON Parsing

**Usage:**
```typescript
import { safeParse, getLocalStorage, setLocalStorage } from '@/utils/safeParse';

// Parse JSON safely
const data = safeParse<MyType>(jsonString, defaultValue);

// Safe localStorage operations
const settings = getLocalStorage<Settings>('settings', {});
setLocalStorage('settings', newSettings);
```

**Benefits:**
- Never crashes from corrupted data
- Type-safe operations
- Automatic fallback values

---

### 2. Error Boundaries

**Already Configured:**
The entire app is wrapped in `<ErrorBoundary>`. Any JavaScript errors will show a user-friendly recovery screen instead of crashing.

**Custom Usage:**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Log to error tracking service
  }}
>
  <YourComponent />
</ErrorBoundary>
```

---

### 3. API Validation

**Usage:**
```typescript
import { validateOrThrow, GenerateIdeasResponseSchema } from '@/schemas/apiSchemas';

// Validate API response
const validatedData = validateOrThrow(
  GenerateIdeasResponseSchema,
  apiResponse,
  'Invalid ideas response'
);

// Now you have type-safe data
validatedData.ideas.forEach(idea => {
  console.log(idea.title); // TypeScript knows the structure
});
```

**Available Schemas:**
- `IdeaSchema`
- `GenerateIdeasResponseSchema`
- `ChatMessageSchema`
- `UserProfileSchema`
- `PaymentSchema`
- `ReferralSchema`
- `DocumentSchema`

---

### 4. Tier Restrictions

**Usage:**
```typescript
import { canGenerateIdeas, canGenerateDocuments } from '@/utils/tierLimits';

const tier = profile.subscription_tier; // 'free' | 'pro' | 'enterprise'
const currentCount = profile.ideas_generated;

const { allowed, limit, remaining } = canGenerateIdeas(tier, currentCount);

if (!allowed) {
  // Show PaywallModal
  setShowPaywall(true);
}
```

**Tier Limits:**
- **Free:** 5 ideas/month, 3 documents/month
- **Pro:** Unlimited everything
- **Enterprise:** Unlimited + API access

---

### 5. Paywall Modal

**Usage:**
```typescript
import { PaywallModal } from '@/components/PaywallModal';

<PaywallModal
  open={showPaywall}
  onOpenChange={setShowPaywall}
  reason="ideas_limit"
  currentTier="free"
  limitReached={5}
/>
```

**Reasons:**
- `ideas_limit` - Reached idea generation limit
- `documents_limit` - Reached document limit
- `features_limit` - Feature requires upgrade

---

### 6. Loading States

**Skeleton Components:**
```typescript
import {
  CardSkeleton,
  IdeaCardSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  PageLoadingSkeleton
} from '@/components/LoadingSkeleton';

{isLoading ? (
  <DashboardSkeleton />
) : (
  <Dashboard data={data} />
)}
```

**Loading Fallback:**
```typescript
import { LoadingFallback } from '@/components/LoadingFallback';

<Suspense fallback={<LoadingFallback />}>
  <LazyComponent />
</Suspense>
```

---

### 7. Empty States

**Usage:**
```typescript
import { EmptyState } from '@/components/EmptyState';
import { Lightbulb } from 'lucide-react';

{items.length === 0 ? (
  <EmptyState
    icon={Lightbulb}
    title="No ideas yet"
    description="Generate your first business idea to get started"
    action={{
      label: "Generate Ideas",
      onClick: () => navigate('/wizard'),
      icon: Sparkles
    }}
    secondaryAction={{
      label: "Learn More",
      onClick: () => navigate('/faq')
    }}
  />
) : (
  <ItemList items={items} />
)}
```

**Compact Version:**
```typescript
import { CompactEmptyState } from '@/components/EmptyState';

<CompactEmptyState
  icon={FileText}
  message="No documents found"
  action={{
    label: "Create Document",
    onClick: handleCreate
  }}
/>
```

---

### 8. Search & Filtering

**Basic Search:**
```typescript
import { useSearch } from '@/hooks/useSearch';

const { filteredItems, setQuery, setFilter, clearFilters } = useSearch({
  items: ideas,
  searchFields: ['title', 'description', 'category'],
});

// In your component
<Input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search ideas..."
/>

{filteredItems.map(item => <IdeaCard key={item.id} idea={item} />)}
```

**With Pagination:**
```typescript
import { useSearchWithPagination } from '@/hooks/useSearch';

const {
  paginatedItems,
  currentPage,
  totalPages,
  nextPage,
  previousPage,
  setQuery,
  setFilter,
} = useSearchWithPagination({
  items: ideas,
  searchFields: ['title', 'description'],
  filterFn: (idea, filters) => {
    // Custom filtering logic
    return filters.categories?.includes(idea.category);
  },
}, 10); // 10 items per page

// Render pagination controls
<div>
  <button onClick={previousPage} disabled={!hasPreviousPage}>Previous</button>
  <span>Page {currentPage} of {totalPages}</span>
  <button onClick={nextPage} disabled={!hasNextPage}>Next</button>
</div>
```

**Advanced Filtering:**
```typescript
// Category filter
setFilter('categories', ['technology', 'ecommerce']);

// Date range filter
setFilter('dateRange', { start: new Date('2025-01-01'), end: new Date() });

// Sorting
setSort('created_at', 'desc');

// Clear all filters
clearFilters();
```

---

### 9. Performance Monitoring

**Already Configured:**
Performance monitoring is automatically initialized in `main.tsx`. Core Web Vitals are tracked and reported.

**Custom Performance Tracking:**
```typescript
import { trackPerformanceMark, trackPerformanceMeasure } from '@/utils/performanceMonitoring';

// Mark the start of an operation
trackPerformanceMark('idea-generation-start');

// Do the operation
await generateIdeas();

// Mark the end
trackPerformanceMark('idea-generation-end');

// Measure the duration
trackPerformanceMeasure(
  'idea-generation',
  'idea-generation-start',
  'idea-generation-end'
);
```

**Track API Calls:**
```typescript
import { trackAPICall } from '@/utils/performanceMonitoring';

const startTime = Date.now();
const response = await fetch('/api/ideas');
const duration = Date.now() - startTime;

trackAPICall('/api/ideas', duration, response.ok);
```

---

### 10. SEO Components

**Page SEO:**
```typescript
import { SEO } from '@/components/SEO';

<SEO
  title="Business Ideas for Toronto"
  description="Discover personalized business ideas for Toronto, Ontario"
  keywords={['toronto business', 'ontario startups', 'canadian business']}
  image="/og-toronto.jpg"
  url="https://sparkbusinessbuddy.ca/toronto"
/>
```

**Structured Data:**
```typescript
import { OrganizationSchema, ServiceSchema, FAQSchema } from '@/components/SEO';

// Organization info
<OrganizationSchema />

// Service/product info
<ServiceSchema />

// FAQ page
<FAQSchema
  faqs={[
    { question: "How does it work?", answer: "..." },
    { question: "Is it free?", answer: "..." },
  ]}
/>
```

**Breadcrumbs:**
```typescript
import { BreadcrumbSchema } from '@/components/SEO';

<BreadcrumbSchema
  items={[
    { name: "Home", url: "/" },
    { name: "Ideas", url: "/app/ideas" },
    { name: "Technology Ideas", url: "/app/ideas/technology" },
  ]}
/>
```

---

## 🎨 Accessibility Features

### Keyboard Navigation
All interactive elements support keyboard navigation:
- **Tab:** Navigate between elements
- **Enter/Space:** Activate buttons and select items
- **Escape:** Close modals and dialogs

### ARIA Labels
Properly labeled for screen readers:
```typescript
<div role="region" aria-label="Province selection">
  <div role="radiogroup" aria-labelledby="province-label">
    <button
      role="radio"
      aria-checked={selected}
      aria-label="Ontario (ON)"
    >
      ON
    </button>
  </div>
</div>
```

### Focus Management
- Visible focus indicators
- Focus trapping in modals
- Auto-focus on important inputs

---

## 📊 Analytics Events

### Automatic Tracking
- **Performance:** Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- **API Calls:** Duration and success rate
- **Route Changes:** Navigation performance

### Custom Events (from existing code)
- `wizard_started` - User starts wizard
- `wizard_resumed` - User resumes saved progress
- `wizard_saved` - User saves and exits
- `paywall_shown` - Tier limit reached
- `paywall_upgrade_clicked` - User clicks upgrade
- `ab_test_assigned` - A/B test variant assigned

---

## 🔒 Security Best Practices

### 1. Never Use Raw localStorage
```typescript
// ❌ Bad
const data = JSON.parse(localStorage.getItem('data'));

// ✅ Good
import { getLocalStorage } from '@/utils/safeParse';
const data = getLocalStorage<MyType>('data', defaultValue);
```

### 2. Always Validate API Responses
```typescript
// ❌ Bad
const ideas = apiResponse.ideas;

// ✅ Good
import { validateOrThrow, GenerateIdeasResponseSchema } from '@/schemas/apiSchemas';
const validated = validateOrThrow(GenerateIdeasResponseSchema, apiResponse);
const ideas = validated.ideas;
```

### 3. Check Tier Limits Before Operations
```typescript
// ❌ Bad
await generateIdeas();

// ✅ Good
import { canGenerateIdeas } from '@/utils/tierLimits';
const { allowed } = canGenerateIdeas(tier, currentCount);
if (!allowed) {
  setShowPaywall(true);
  return;
}
await generateIdeas();
```

---

## 🚀 Performance Tips

### 1. Use Loading Skeletons
Shows content structure while loading:
```typescript
{isLoading ? <IdeaCardSkeleton /> : <IdeaCard idea={idea} />}
```

### 2. Lazy Load Routes
Already configured for all routes - no action needed!

### 3. Monitor Performance
Check Chrome DevTools → Lighthouse for Web Vitals scores.

### 4. Use Empty States
Provides clear CTAs when no data:
```typescript
{items.length === 0 ? <EmptyState .../> : <ItemList .../>}
```

---

## 📱 Mobile Considerations

### Touch Targets
Minimum 44×44px for all interactive elements (already implemented).

### Responsive Design
All components are responsive and work on mobile.

### Safe Area Support
Ready for notches and rounded corners (in future enhancement).

---

## 🛠️ Development Workflow

### Adding a New Page
1. Create component in `src/pages/`
2. Add lazy import in `App.tsx`
3. Add route in `App.tsx`
4. Add SEO component to page
5. Add to `sitemap.xml`

### Adding a New Feature
1. Check tier restrictions if needed
2. Add loading states
3. Add empty states
4. Add error handling
5. Add analytics tracking
6. Add accessibility features

---

## 📚 Additional Resources

- [ENHANCEMENT_IMPLEMENTATION_PLAN.md](ENHANCEMENT_IMPLEMENTATION_PLAN.md) - Full roadmap
- [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md) - Phase 1 details
- [ALL_PHASES_IMPLEMENTATION_COMPLETE.md](ALL_PHASES_IMPLEMENTATION_COMPLETE.md) - Complete summary

---

**Questions?** All components have JSDoc comments with usage examples!

