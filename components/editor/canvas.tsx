"use client";

import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Component,
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  DEFAULT_NODE_COLOR,
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  TEXT_DEFAULT_SIZE,
  TEXT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

import { CANVAS_FONT_VARIABLES, DEFAULT_FONT_KEY } from "./canvas-fonts";
import { CanvasNodeRenderer } from "./canvas-node";
import { ShapeOutline } from "./shape-outline";
import { ShapePanel } from "./shape-panel";

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
            <ReactFlowProvider>
              <CanvasFlow />
            </ReactFlowProvider>
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

  const { screenToFlowPosition } = useReactFlow();
  const counterRef = useRef(0);

  const [ghost, setGhost] = useState<{
    shape: CanvasNodeShape;
    x: number;
    y: number;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const updateNodeData = useCallback(
    (id: string, patch: Partial<CanvasNodeData>) => {
      const current = nodes.find((node) => node.id === id);
      if (!current) return;
      const change: NodeChange<CanvasNode> = {
        type: "replace",
        id,
        item: { ...current, data: { ...current.data, ...patch } },
      };
      onNodesChange([change]);
    },
    [nodes, onNodesChange],
  );

  const replaceLabel = useCallback(
    (id: string, label: string) => updateNodeData(id, { label }),
    [updateNodeData],
  );

  const handleChangeFont = useCallback(
    (id: string, font: string) => updateNodeData(id, { font }),
    [updateNodeData],
  );

  const handleChangeFontSize = useCallback(
    (id: string, fontSize: number) => updateNodeData(id, { fontSize }),
    [updateNodeData],
  );

  const handleStartEdit = useCallback(
    (id: string, label: string) => {
      setEditingId(id);
      replaceLabel(id, label);
    },
    [replaceLabel],
  );

  const handleChangeLabel = useCallback(
    (id: string, label: string) => {
      replaceLabel(id, label);
    },
    [replaceLabel],
  );

  const handleEndEdit = useCallback(
    (id: string) => {
      setEditingId((current) => (current === id ? null : current));
    },
    [],
  );

  const nodeTypes = useMemo(
    () => ({
      canvasNode: (props: NodeProps<CanvasNode>) => (
        <CanvasNodeRenderer
          {...props}
          isEditing={editingId === props.id}
          onStartEdit={handleStartEdit}
          onChangeLabel={handleChangeLabel}
          onChangeFont={handleChangeFont}
          onChangeFontSize={handleChangeFontSize}
          onEndEdit={handleEndEdit}
        />
      ),
    }),
    [
      editingId,
      handleStartEdit,
      handleChangeLabel,
      handleChangeFont,
      handleChangeFontSize,
      handleEndEdit,
    ],
  );

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, payload: ShapeDragPayload) => {
      event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "copy";
      setGhost({
        shape: payload.shape,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setGhost((current) =>
        current
          ? { shape: current.shape, x: event.clientX, y: event.clientY }
          : current,
      );
    },
    [],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setGhost(null);
      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      counterRef.current += 1;
      const id = `${payload.shape}-${Date.now()}-${counterRef.current}`;

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
          font: DEFAULT_FONT_KEY,
        },
      };

      const change: NodeChange<CanvasNode> = { type: "add", item: newNode };
      onNodesChange([change]);
    },
    [onNodesChange, screenToFlowPosition],
  );

  const createTextNode = useCallback(
    (clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      counterRef.current += 1;
      const id = `text-${Date.now()}-${counterRef.current}`;

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position: {
          x: position.x - TEXT_DEFAULT_SIZE.width / 2,
          y: position.y - TEXT_DEFAULT_SIZE.height / 2,
        },
        width: TEXT_DEFAULT_SIZE.width,
        height: TEXT_DEFAULT_SIZE.height,
        data: {
          label: "",
          color: TEXT_NODE_COLOR,
          shape: "text",
          font: DEFAULT_FONT_KEY,
        },
      };

      const change: NodeChange<CanvasNode> = { type: "add", item: newNode };
      onNodesChange([change]);
      setEditingId(id);
    },
    [onNodesChange, screenToFlowPosition],
  );

  const paneClickRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const handlePaneClick = useCallback(
    (event: MouseEvent) => {
      const now = Date.now();
      const previous = paneClickRef.current;
      paneClickRef.current = { x: event.clientX, y: event.clientY, time: now };
      if (!previous) return;
      const elapsed = now - previous.time;
      const distance = Math.hypot(
        event.clientX - previous.x,
        event.clientY - previous.y,
      );
      if (elapsed <= 300 && distance <= 8) {
        createTextNode(event.clientX, event.clientY);
      }
    },
    [createTextNode],
  );

  return (
    <div
      className={`relative h-full w-full bg-[#0a0a12] ${CANVAS_FONT_VARIABLES}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={() => setGhost(null)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onPaneClick={handlePaneClick}
        connectionRadius={40}
        zoomOnDoubleClick={false}
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
      <ShapePanel onDragStart={handleDragStart} />
      {ghost ? (
        <DragGhost
          shape={ghost.shape}
          x={ghost.x}
          y={ghost.y}
          size={SHAPE_DEFAULT_SIZES[ghost.shape]}
        />
      ) : null}
    </div>
  );
}

interface DragGhostProps {
  shape: CanvasNodeShape;
  x: number;
  y: number;
  size: { width: number; height: number };
}

function DragGhost({ shape, x, y, size }: DragGhostProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50"
      style={{
        left: x - size.width / 2,
        top: y - size.height / 2,
        width: size.width,
        height: size.height,
      }}
    >
      <ShapeOutline shape={shape} color={DEFAULT_NODE_COLOR} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-copy-primary">
        {shape}
      </div>
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
