"use client";

import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Component, type ReactNode } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

interface CanvasProps {
  roomId: string;
}

export function Canvas({ roomId }: CanvasProps) {
  return (
    <CanvasErrorBoundary>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CanvasFlow />
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}

function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  return (
    <div className="relative h-full w-full bg-[#0a0a12]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionRadius={40}
        fitView
        colorMode="dark"
        style={{ backgroundColor: "transparent" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="rgba(255,255,255,0.28)"
          style={{ backgroundColor: "transparent" }}
        />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <CanvasSkin />
    </div>
  );
}

function CanvasSkin() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </>
  );
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-2 text-copy-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-xs">Connecting to room…</p>
      </div>
    </div>
  );
}

function CanvasError({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="flex max-w-sm flex-col items-center gap-2 px-6 text-center text-copy-muted">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <p className="text-sm font-medium text-copy-primary">
          Canvas connection failed
        </p>
        <p className="text-xs leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

interface CanvasErrorBoundaryState {
  error: Error | null;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <CanvasError message={this.state.error.message} />;
    }
    return this.props.children;
  }
}
