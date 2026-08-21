"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type EdgeChange,
  type EdgeProps,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
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
  DEFAULT_NODE_BG,
  DEFAULT_NODE_COLOR,
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  TEXT_DEFAULT_SIZE,
  TEXT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
  type CanvasNodeShape,
  type NodeColorPair,
  type ShapeDragPayload,
} from "@/types/canvas";

import { CANVAS_FONT_VARIABLES, DEFAULT_FONT_KEY } from "./canvas-fonts";
import { CanvasControls } from "./canvas-controls";
import { CanvasEdgeComponent } from "./canvas-edge";
import { CanvasNodeRenderer } from "./canvas-node";
import { ShapeOutline } from "./shape-outline";
import { ShapePanel } from "./shape-panel";
import { CanvasCursor, PresenceOverlay } from "./presence-overlay";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { buildTemplateImportChanges } from "./template-import";
import type { CanvasTemplate } from "./starter-templates";
import { useWorkspace } from "./workspace-context";
import { useTheme } from "@/components/theme";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

interface CanvasProps {
  roomId: string;
  /** Server-resolved permission; viewers get a read-only canvas. */
  canEdit: boolean;
}

export function Canvas({ roomId, canEdit }: CanvasProps) {
  return (
    <CanvasErrorBoundary>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, thinking: false }}
        >
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <ReactFlowProvider>
              <CanvasFlow canEdit={canEdit} />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}

interface CanvasFlowProps {
  canEdit: boolean;
}

function CanvasFlow({ canEdit }: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const flow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = flow;
  const counterRef = useRef(0);

  // Viewers may pan, zoom and select, but never mutate the shared document.
  // The Liveblocks room grant enforces this server-side; this only keeps the
  // UI honest so read-only users are not offered controls that would fail.
  const { isStarterTemplatesOpen, openStarterTemplates, closeStarterTemplates } =
    useWorkspace();

  const { theme } = useTheme();

  const [ghost, setGhost] = useState<{
    shape: CanvasNodeShape;
    x: number;
    y: number;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useUndo();
  const redo = useRedo();

  useKeyboardShortcuts({
    flow,
    onUndo: undo,
    onRedo: redo,
    enabled: canEdit,
  });

  // React Flow emits selection and measurement changes that are purely local;
  // those stay allowed for viewers so the canvas remains navigable.
  const handleNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      if (canEdit) {
        onNodesChange(changes);
        return;
      }
      const local = changes.filter(
        (change) => change.type === "select" || change.type === "dimensions",
      );
      if (local.length > 0) onNodesChange(local);
    },
    [canEdit, onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdge>[]) => {
      if (canEdit) {
        onEdgesChange(changes);
        return;
      }
      const local = changes.filter((change) => change.type === "select");
      if (local.length > 0) onEdgesChange(local);
    },
    [canEdit, onEdgesChange],
  );

  const updateNodeData = useCallback(
    (id: string, patch: Partial<CanvasNodeData>) => {
      if (!canEdit) return;
      const current = nodes.find((node) => node.id === id);
      if (!current) return;
      const change: NodeChange<CanvasNode> = {
        type: "replace",
        id,
        item: { ...current, data: { ...current.data, ...patch } },
      };
      onNodesChange([change]);
    },
    [canEdit, nodes, onNodesChange],
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

  const handleChangeColor = useCallback(
    (id: string, pair: NodeColorPair) =>
      updateNodeData(id, { color: pair.text, bg: pair.bg }),
    [updateNodeData],
  );

  const handleAutoSize = useCallback(
    (id: string, next: { width: number; height: number }) => {
      if (!canEdit) return;
      const current = nodes.find((node) => node.id === id);
      if (!current) return;
      if (current.width === next.width && current.height === next.height) return;
      // Write the size into the node object through the same replace channel
      // as typing/persisting, so the box grows deterministically instead of
      // relying on the dimensions round-trip alone.
      onNodesChange([
        {
          type: "replace",
          id,
          item: { ...current, width: next.width, height: next.height },
        },
        { type: "dimensions", id, dimensions: next, setAttributes: true },
      ]);
    },
    [canEdit, nodes, onNodesChange],
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

  const handleDeleteNode = useCallback(
    (id: string) => {
      if (!canEdit) return;
      setEditingId((current) => (current === id ? null : current));
      const nodeToDelete = nodes.find((node) => node.id === id);
      if (!nodeToDelete) return;
      const connectedEdges = edges.filter(
        (edge) => edge.source === id || edge.target === id,
      );
      onDelete({ nodes: [nodeToDelete], edges: connectedEdges });
    },
    [canEdit, nodes, edges, onDelete],
  );

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      if (!canEdit) return;

      const stamp = `${Date.now()}-${counterRef.current}`;
      counterRef.current += 1;

      const { nodeChanges, edgeChanges } = buildTemplateImportChanges({
        nodes,
        edges,
        template,
        stamp,
      });

      onNodesChange(nodeChanges);
      onEdgesChange(edgeChanges);
      closeStarterTemplates();
      requestAnimationFrame(() => {
        flow.fitView({ padding: 0.2, duration: 300 });
      });
    },
    [
      canEdit,
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      closeStarterTemplates,
      flow,
    ],
  );

  const handleChangeEdgeLabel = useCallback(
    (id: string, label: string) => {
      if (!canEdit) return;
      setEditingEdgeId((current) => (current === id ? null : current));
      const current = edges.find((edge) => edge.id === id);
      if (!current) return;
      const change: EdgeChange<CanvasEdge> = {
        type: "replace",
        id,
        item: { ...current, data: { ...current.data, label } },
      };
      onEdgesChange([change]);
    },
    [canEdit, edges, onEdgesChange],
  );

  const edgeTypes = useMemo(() => {
    const render = (props: EdgeProps<CanvasEdge>) => (
      <CanvasEdgeComponent
        {...props}
        isEditing={editingEdgeId === props.id}
        onStartEdit={() => setEditingEdgeId(props.id)}
        onCommitLabel={(label) => handleChangeEdgeLabel(props.id, label)}
      />
    );
    return { canvasEdge: render, default: render };
  }, [editingEdgeId, handleChangeEdgeLabel]);

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
          onChangeColor={handleChangeColor}
          onEndEdit={handleEndEdit}
          onDeleteNode={handleDeleteNode}
          onAutoSize={handleAutoSize}
        />
      ),
    }),
    [
      editingId,
      handleStartEdit,
      handleChangeLabel,
      handleChangeFont,
      handleChangeFontSize,
      handleChangeColor,
      handleEndEdit,
      handleDeleteNode,
      handleAutoSize,
    ],
  );

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, payload: ShapeDragPayload) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const grabOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setDragImage(event.currentTarget, grabOffset.x, grabOffset.y);
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
      if (!canEdit) return;
      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      // `screenToFlowPosition` already removes the canvas wrapper's bounding
      // rect offset and undoes the current pan + zoom transform, so the drop
      // cursor lands on the correct flow coordinate regardless of viewport.
      const cursor = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      counterRef.current += 1;
      const id = `${payload.shape}-${Date.now()}-${counterRef.current}`;

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position: {
          x: cursor.x - payload.width / 2,
          y: cursor.y - payload.height / 2,
        },
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          bg: DEFAULT_NODE_BG,
          shape: payload.shape,
          font: DEFAULT_FONT_KEY,
        },
      };

      const change: NodeChange<CanvasNode> = { type: "add", item: newNode };
      onNodesChange([change]);
    },
    [canEdit, onNodesChange, screenToFlowPosition],
  );

  const createTextNode = useCallback(
    (clientX: number, clientY: number) => {
      if (!canEdit) return;
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
    [canEdit, onNodesChange, screenToFlowPosition],
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
      className={`relative h-full w-full ${CANVAS_FONT_VARIABLES}`}
      style={{ backgroundColor: "var(--canvas-bg)" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={() => setGhost(null)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={canEdit ? onConnect : undefined}
        onDelete={canEdit ? onDelete : undefined}
        onPaneClick={handlePaneClick}
        onEdgeDoubleClick={(event, edge) => {
          if (canEdit) setEditingEdgeId(edge.id);
        }}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        edgesReconnectable={canEdit}
        deleteKeyCode={canEdit ? undefined : null}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        zoomOnDoubleClick={false}
        fitView
        colorMode={theme}
        style={{ backgroundColor: "transparent" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="var(--canvas-dot)"
          style={{ backgroundColor: "transparent" }}
        />
        <MiniMap
          pannable
          zoomable
          style={{ backgroundColor: "var(--canvas-bg)" }}
        />
        <Cursors components={{ Cursor: CanvasCursor }} />
      </ReactFlow>
      <CanvasSkin />
      <PresenceOverlay />
      {nodes.length === 0 ? (
        <CanvasEmptyState
          canEdit={canEdit}
          onBrowseTemplates={openStarterTemplates}
        />
      ) : null}
      <CanvasControls
        canUndo={canEdit && canUndo}
        canRedo={canEdit && canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      {canEdit ? <ShapePanel onDragStart={handleDragStart} /> : <ViewOnlyBadge />}
      {ghost ? (
        <DragGhost
          shape={ghost.shape}
          x={ghost.x}
          y={ghost.y}
          size={SHAPE_DEFAULT_SIZES[ghost.shape]}
        />
      ) : null}
      <StarterTemplatesModal
        open={isStarterTemplatesOpen}
        onOpenChange={(open) => {
          if (!open) closeStarterTemplates();
        }}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

function CanvasEmptyState({
  canEdit,
  onBrowseTemplates,
}: {
  canEdit: boolean;
  onBrowseTemplates: () => void;
}) {
  return (
    <div
      aria-hidden={!canEdit}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface/70 shadow-sm">
          <Sparkles className="h-6 w-6 text-brand" />
        </div>
        <h2 className="text-lg font-medium tracking-tight text-copy-primary">
          Start a new architecture workspace
        </h2>
        <p className="text-sm leading-relaxed text-copy-muted">
          {canEdit
            ? "Bring your first idea to life — drag a shape from the panel, or double-click the canvas to add a note. Prefer a head start? Explore the starter templates."
            : "This workspace is still empty. Ask the owner to add their first shape or import a template."}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onBrowseTemplates}
            className="pointer-events-auto rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-brand/90"
          >
            Browse templates
          </button>
        )}
        {canEdit && (
          <p className="text-[11px] text-copy-faint">
            Tip: drop a node from the shapes panel, or double-click anywhere to
            add text.
          </p>
        )}
      </div>
    </div>
  );
}

function ViewOnlyBadge() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-surface-border bg-surface/90 px-3 py-1.5 text-xs text-copy-muted shadow-lg backdrop-blur">
      View only \u2014 ask the owner for edit access
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
      <ShapeOutline shape={shape} color={DEFAULT_NODE_COLOR} bg={DEFAULT_NODE_BG} />
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
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, var(--canvas-vignette) 100%)",
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
