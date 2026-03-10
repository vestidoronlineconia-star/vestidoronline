

## Plan: Replace 3 Placeholder Files with Real PR Content

Replace the placeholder versions of `src/lib/plans.ts`, `src/pages/Onboarding.tsx`, and `src/pages/Planes.tsx` with the actual code from the uploaded files.

### Changes

1. **`src/lib/plans.ts`** — Replace entirely with the real plan definitions. Key differences from placeholder:
   - Plan descriptions updated (e.g., "Para probar la experiencia" instead of "Probá sin compromiso")
   - Features list has 5 items per plan instead of 4
   - Last plan is "Ilimitado" (not "Empresa"), priced at $29.99/mes
   - Pro plan priced at $14.99 instead of $9.99
   - CTA text updated (e.g., "Elegir Básico" instead of generic "Elegir plan")

2. **`src/pages/Onboarding.tsx`** — Replace placeholder with full 440-line implementation including:
   - 3-step flow: profile form → selfie capture → body photo capture
   - Camera integration with `getUserMedia`, facing mode toggle, and 5-second countdown timer for body photos
   - Photo upload to `user-photos` storage bucket
   - Profile creation/update via `useUserProfile` hook
   - Auto-redirect when onboarding is complete
   - Pre-fills name from Google auth metadata

3. **`src/pages/Planes.tsx`** — Replace placeholder with full 251-line implementation including:
   - Plan selection cards with preselection from URL params
   - Comparison table (desktop)
   - Payment section with trust signals
   - FAQ section
   - Uses `bg-ambient` and `fade-in-up` CSS classes (already exist in `index.css`)

### Storage Requirement

The Onboarding page uploads photos to a `user-photos` storage bucket. A storage bucket creation may be needed if it doesn't already exist.

