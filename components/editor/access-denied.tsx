import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface">
          <Lock className="h-6 w-6 text-copy-secondary" />
        </div>
        <h1 className="text-xl font-medium text-copy-primary">
          You don&apos;t have access to this project
        </h1>
        <p className="text-sm text-copy-muted">
          It may have been deleted, or its owner hasn&apos;t shared it with you.
        </p>
        <Button asChild variant="outline">
          <Link href="/editor">Back to projects</Link>
        </Button>
      </div>
    </div>
  );
}
