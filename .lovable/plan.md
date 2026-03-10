

## Plan: Apply GitHub PR #3 Changes Manually

The PR contains cleanup, performance improvements, and new features. The diff is truncated (2953/4890 lines), so 3 files are incomplete: `src/lib/plans.ts`, `src/pages/Onboarding.tsx`, and `src/pages/Planes.tsx`.

### Changes to Apply

**1. Delete unused UI components (10 files)**
Remove files no longer needed after dependency cleanup:
- `src/components/ui/accordion.tsx`
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/carousel.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/resizable.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/toggle-group.tsx`
- `src/components/ui/use-toast.ts`
- `src/hooks/use-toast.ts`

**2. Update `src/components/ui/sonner.tsx`**
Remove `next-themes` import, hardcode `theme="dark"`.

**3. Update `src/components/ui/loader-grid.tsx`**
Replace `styled-components` implementation with inline CSS + Tailwind (remove `styled-components` dependency).

**4. Update `src/hooks/useAuth.tsx`**
Add `useRef`/`useCallback` to avoid unnecessary re-renders on `TOKEN_REFRESHED` events (alt-tab).

**5. Update `src/hooks/useAccessRequest.tsx`**
Replace `useToast()` hook with `sonner` `toast.error()`/`toast.success()` calls throughout.

**6. Update `src/hooks/useUserRole.tsx`**
Add `console.error` logging in 3 error-handling blocks.

**7. Update `src/lib/imageCompression.ts`**
Add `URL.revokeObjectURL()` calls in `onload` and `onerror` handlers.

**8. Create new files**
- `src/hooks/useUserProfile.tsx` — User profile hook with `fetchProfile`, `createProfile`, `updateProfile`, `decrementUse`.
- `src/components/PricingModal.tsx` — Plan selection modal dialog.
- `src/lib/plans.ts` — Plan definitions (partial content available, will need user input for the PLANS array).

**9. Update `src/App.tsx`**
- Remove `<Toaster />` (radix), keep only `<Sonner />`.
- Lazy load `Index`, `Auth`, `ResetPassword` + new pages `Onboarding`, `Planes`.
- Add onboarding redirect logic in `ProtectedRoute` using `useUserProfile`.
- Configure `QueryClient` with `staleTime`, `retry`, `refetchOnWindowFocus`.
- Wrap all `<Routes>` in `<Suspense>`.
- Add `/onboarding` and `/planes` routes.
- Sanitize redirect path in `AuthRoute`.

**10. Remove unused dependencies from `package.json`**
Remove: `@radix-ui/react-accordion`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-toast`, `@radix-ui/react-toggle-group`, `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-resizable-panels`, `styled-components`, `vaul`.

### Missing Content (Truncated in Diff)

The following files were cut off and I do NOT have their full content:
- **`src/lib/plans.ts`** — Only the type definitions are visible; the `PLANS` array is missing.
- **`src/pages/Onboarding.tsx`** — Entire file missing.
- **`src/pages/Planes.tsx`** — Entire file missing.

I will apply everything I have. For the 3 truncated files, you will need to either:
1. Paste their content in chat, or
2. Let me create placeholder versions that you can refine later.

### Database Consideration

The `useUserProfile` hook references a `user_profiles` table and an `decrement_free_uses` RPC function. A database migration will be needed if these don't already exist.

