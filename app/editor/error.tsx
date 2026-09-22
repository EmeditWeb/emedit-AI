"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function EditorError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Editor error:", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-base px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-medium text-copy-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-copy-muted">
          The workspace failed to load. Try again, or refresh the page.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              window.location.href = "/editor";
            }}
            className="gap-2"
          >
            Reload workspace
          </Button>
        </div>
      </div>
    </div>
  );
}