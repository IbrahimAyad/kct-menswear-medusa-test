# 🔧 TypeScript Agent Instructions - V2
**CRITICAL UPDATE:** Based on 10+ hours of failed debugging

---

## 🚨 READ THIS FIRST - BEFORE YOU DO ANYTHING

### What Happened:
- We spent 10+ hours trying to fix TypeScript and SSG errors
- Changed 120+ files multiple times
- Result: COMPLETE FAILURE, had to revert everything

### Current State:
- **TypeScript is DISABLED** in next.config.ts
- **This is intentional** - 98% of errors were fixed, remaining 2% not critical
- **DO NOT RE-ENABLE** until V2

---

## ❌ DO NOT DO THESE (We Already Failed)

### 1. DO NOT Add Runtime Exports
```typescript
// ❌ NEVER ADD THESE
export const runtime = 'nodejs'  // Breaks Edge Runtime
export const runtime = 'edge'    // Breaks Node.js APIs
```
**Why:** We added these to 120+ files. It made everything worse.

### 2. DO NOT Mass-Edit Files
```bash
# ❌ NEVER DO THIS
sed -i "fix-pattern" **/*.tsx  # We did this, broke everything
```
**Why:** Created 68+ syntax errors, fixed nothing

### 3. DO NOT Try to Fix All TypeScript Errors
```typescript
// ❌ DON'T CHASE PERFECTION
// 98% fixed is good enough for V1
typescript: {
  ignoreBuildErrors: true  // KEEP THIS FOR NOW
}
```
**Why:** The remaining 2% aren't blocking deployment

---

## ✅ IF YOU MUST FIX SOMETHING

### Step 1: Check If It's Actually Broken
```bash
# Test locally FIRST
npm run build

# If it builds, STOP - don't fix what isn't broken
```

### Step 2: Fix ONE Thing
```typescript
// Fix a SPECIFIC error in ONE file
// Test
// Only then move to next
```

### Step 3: Use Type Assertions for V1
```typescript
// For V1, this is acceptable:
const data = response as any  // Fix in V2

// Or use @ts-ignore for critical blockers
// @ts-ignore - Fix in V2
const result = problematicFunction()
```

---

## 📋 Known TypeScript Issues (Leave for V2)

### 1. Async/Await Patterns
```typescript
// Current issue (not critical):
const supabase = createClient()  // Should be awaited

// Quick fix if needed:
const supabase = createClient() as any
```

### 2. Cart Type Mismatches
```typescript
// Current issue:
interface CartItemData // Has slight mismatches

// V1 Solution: Use 'any' for now
```

### 3. Stripe Types
```typescript
// Version mismatch with @stripe/stripe-js
// V1 Solution: Types work at runtime, ignore for now
```

---

## 🎯 Your ONLY Job for V1

### IF the site doesn't deploy:
1. Find the EXACT error blocking deployment
2. Fix ONLY that with minimal changes
3. Test locally first
4. Use `any` or `@ts-ignore` if needed

### IF the site deploys:
**DO NOTHING** - Save TypeScript perfection for V2

---

## 🔴 Critical Warnings

### From Our 10-Hour Failure:
1. **We had TypeScript 98% fixed** - Still wasn't enough
2. **We disabled it** - Site still didn't deploy due to SSG issues
3. **We tried to fix everything** - Made it much worse
4. **We reverted everything** - Lost 10 hours of work

### The Lesson:
**TypeScript errors are NOT your biggest problem**
- The SSG errors are the real blocker
- Focus on deployment, not type perfection
- Ship V1 with warnings, fix in V2

---

## 📊 Priority Order

### For V1 (NOW):
```
1. Site deploys ✅ (THIS IS ALL THAT MATTERS)
2. Core features work ✅
3. TypeScript disabled ✅ (ALREADY DONE)
```

### For V2 (LATER):
```
1. Re-enable TypeScript
2. Fix remaining type errors
3. Remove all 'any' types
4. Add strict type checking
```

---

## 🚀 Quick Fixes If Absolutely Needed

### If TypeScript is blocking deployment:
```typescript
// Option 1: Type assertion
const value = problematicValue as any

// Option 2: Ignore line
// @ts-ignore
const result = breakingFunction()

// Option 3: Ignore file
// @ts-nocheck
// At top of file
```

### Remember:
**Working code with type errors > Perfect types that don't deploy**

---

## ⚠️ FINAL WARNING

**Do NOT:**
- Spend more than 30 minutes on TypeScript issues
- Try to fix all warnings
- Re-enable TypeScript checking for V1
- Add runtime exports to "fix" type issues
- Mass-edit files

**Do:**
- Focus on deployment
- Use quick fixes for blockers
- Save perfection for V2
- Test locally first
- Ship working code

---

**The brutal truth:** We wasted 10 hours on TypeScript and SSG "fixes" that made things worse. Don't repeat our mistakes. Ship V1, fix types in V2.

*Last updated after reverting 10 hours of failed work*