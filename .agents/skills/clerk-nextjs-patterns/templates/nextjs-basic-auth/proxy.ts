// Minimal starter middleware. This does NOT enforce authentication on any route.
// Extend with `auth.protect()` (see references/middleware-strategies.md) before
// shipping — e.g., wrap with an async handler that calls `await auth.protect()`
// for non-public routes, or use `createRouteMatcher` to gate specific paths.
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
