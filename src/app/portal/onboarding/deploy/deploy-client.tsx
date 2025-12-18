   Creating an optimized production build ...
 ⚠ Compiled with warnings

./src/app/portal/generate/generate-client.tsx
Attempted import error: 'onboard' is not exported from '@/lib/agent' (imported as 'onboard').

Import trace for requested module:
./src/app/portal/generate/generate-client.tsx

./src/app/portal/onboarding/deploy/deploy-client.tsx
Attempted import error: 'onboard' is not exported from '@/lib/agent' (imported as 'onboard').

Import trace for requested module:
./src/app/portal/onboarding/deploy/deploy-client.tsx

 ⚠ Compiled with warnings

./src/app/portal/generate/generate-client.tsx
Attempted import error: 'onboard' is not exported from '@/lib/agent' (imported as 'onboard').

Import trace for requested module:
./src/app/portal/generate/generate-client.tsx

./src/app/portal/onboarding/deploy/deploy-client.tsx
Attempted import error: 'onboard' is not exported from '@/lib/agent' (imported as 'onboard').

Import trace for requested module:
./src/app/portal/onboarding/deploy/deploy-client.tsx

 ✓ Compiled successfully
   Linting and checking validity of types ...
Failed to compile.

./src/app/portal/generate/generate-client.tsx:5:10
Type error: Module '"@/lib/agent"' has no exported member 'onboard'.

  3 | import { useState } from "react";
  4 | import { useRouter } from "next/navigation";
> 5 | import { onboard } from "@/lib/agent";
    |          ^
  6 |
  7 | export default function GenerateClient() {
  8 |   const router = useRouter();

##[error]Bash exited with code '1'.
Finishing: Build Next.js