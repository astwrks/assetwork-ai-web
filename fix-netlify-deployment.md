# Fix Netlify Deployment Errors

## Problem
Netlify is trying to build from a repository with structure `src/app/...` but missing UI components.

## Solution Steps

### 1. Check Which Repository Netlify is Building
Go to your Netlify dashboard and check which GitHub repository is connected.

### 2. If Using the `assetwork-ai-web` Repository:

You need to add the missing components to that repository. Here's what's missing:

- `src/components/ui/switch.tsx`
- Possibly other components depending on the repository structure

### 3. Create the Missing Switch Component

Navigate to the repository that Netlify is deploying and create:

**File: `src/components/ui/switch.tsx`** (note the `src/` prefix)

```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

### 4. Install Required Dependencies

Make sure `@radix-ui/react-switch` is installed in the deployed repository:

```bash
npm install @radix-ui/react-switch
```

### 5. Commit and Push

```bash
git add src/components/ui/switch.tsx
git commit -m "Add missing Switch component for Netlify deployment"
git push origin main
```

### 6. Alternative: Use shadcn CLI

If you have shadcn/ui set up in that repository:

```bash
npx shadcn@latest add switch
```

This will automatically create the component with all necessary dependencies.

## Quick Fix Commands

Run these in the repository that Netlify is deploying:

```bash
# 1. Navigate to the correct repository
cd /path/to/assetwork-ai-web

# 2. Install shadcn components
npx shadcn@latest add switch badge select separator tabs

# 3. Commit and push
git add .
git commit -m "Add missing shadcn UI components"
git push origin main
```

## Verify tsconfig.json

Make sure your `tsconfig.json` has the correct path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]  // If using src/ structure
      // OR
      "@/*": ["./*"]      // If not using src/ structure
    }
  }
}
```

## After Fixing

1. Go to Netlify dashboard
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Monitor the build logs

## Still Having Issues?

Check these:
1. ✅ All components exist in the repository
2. ✅ Dependencies are in `package.json`
3. ✅ `tsconfig.json` path aliases are correct
4. ✅ Correct branch is being deployed
5. ✅ Build command is correct: `npm run build`
