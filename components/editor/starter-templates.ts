import { DEFAULT_FONT_KEY } from "@/components/editor/canvas-fonts";
import {
  NODE_COLORS,
  SHAPE_DEFAULT_SIZES,
  TEXT_DEFAULT_SIZE,
  TEXT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const color = (key: string) =>
  NODE_COLORS.find((pair) => pair.key === key) ?? NODE_COLORS[0];

interface NodeOptions {
  color?: string;
  fontKey?: string;
  fontSize?: number;
}

function node(
  id: string,
  x: number,
  y: number,
  shape: CanvasNodeShape,
  label: string,
  options: NodeOptions = {},
): CanvasNode {
  const pair = color(options.color ?? "neutral");
  const size = SHAPE_DEFAULT_SIZES[shape];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: size.width,
    height: size.height,
    data: {
      label,
      color: pair.text,
      bg: pair.bg,
      shape,
      font: options.fontKey ?? DEFAULT_FONT_KEY,
      ...(options.fontSize != null ? { fontSize: options.fontSize } : {}),
    },
  };
}

function text(
  id: string,
  x: number,
  y: number,
  label: string,
  fontSize = 16,
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: TEXT_DEFAULT_SIZE.width,
    height: TEXT_DEFAULT_SIZE.height,
    data: {
      label,
      color: TEXT_NODE_COLOR,
      shape: "text",
      font: DEFAULT_FONT_KEY,
      ...(fontSize ? { fontSize } : {}),
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    ...(label ? { data: { label } } : {}),
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "API gateway with focused services, an event bus, and shared data stores.",
    nodes: [
      node("gateway", 20, 220, "hexagon", "API Gateway", { color: "blue" }),
      node("auth", 320, 40, "rectangle", "Auth Service", { color: "purple" }),
      node("users", 320, 200, "rectangle", "Users Service", {
        color: "teal",
      }),
      node("orders", 320, 360, "rectangle", "Orders Service", {
        color: "orange",
      }),
      node("payments", 320, 520, "rectangle", "Payments Service", {
        color: "pink",
      }),
      node("bus", 680, 300, "circle", "Event Bus", { color: "green" }),
      node("cache", 1020, 120, "cylinder", "Redis Cache", { color: "red" }),
      node("db", 1020, 420, "cylinder", "Postgres", { color: "blue" }),
    ],
    edges: [
      edge("e-gw-auth", "gateway", "auth", "login"),
      edge("e-gw-users", "gateway", "users"),
      edge("e-gw-orders", "gateway", "orders"),
      edge("e-gw-payments", "gateway", "payments"),
      edge("e-auth-bus", "auth", "bus", "user.registered"),
      edge("e-users-bus", "users", "bus"),
      edge("e-orders-bus", "orders", "bus", "order.created"),
      edge("e-pay-bus", "payments", "bus"),
      edge("e-bus-cache", "bus", "cache"),
      edge("e-orders-cache", "orders", "cache"),
      edge("e-bus-db", "bus", "db", "persist"),
      edge("e-pay-db", "payments", "db"),
    ],
  },
  {
    id: "ci-cd",
    name: "CI/CD Pipeline",
    description:
      "Automated flow from source control through testing to production.",
    nodes: [
      text("title", 0, 0, "CI/CD Pipeline", 18),
      node("source", 40, 140, "pill", "Source Control", { color: "blue" }),
      node("build", 300, 140, "pill", "Build", { color: "purple" }),
      node("test", 560, 140, "pill", "Tests", { color: "teal" }),
      node("artifact", 820, 140, "pill", "Artifact", { color: "orange" }),
      node("deploy", 1080, 140, "pill", "Deploy", { color: "green" }),
      node("monitor", 1340, 140, "pill", "Monitor", { color: "red" }),
    ],
    edges: [
      edge("e-source-build", "source", "build", "on push"),
      edge("e-build-test", "build", "test", "unit tests"),
      edge("e-test-artifact", "test", "artifact", "upload"),
      edge("e-artifact-deploy", "artifact", "deploy", "production"),
      edge("e-deploy-monitor", "deploy", "monitor", "metrics"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven",
    description:
      "Producers publish to a broker that fans out to queues and consumers.",
    nodes: [
      node("p1", 20, 0, "rectangle", "Order Producer", { color: "blue" }),
      node("p2", 20, 180, "rectangle", "User Producer", { color: "teal" }),
      node("p3", 20, 360, "rectangle", "Payment Producer", {
        color: "pink",
      }),
      node("broker", 360, 180, "circle", "Event Broker", {
        color: "purple",
      }),
      node("q1", 680, 40, "pill", "Orders Queue", { color: "orange" }),
      node("q2", 680, 320, "pill", "Emails Queue", { color: "purple" }),
      node("c1", 1000, 40, "rectangle", "Order Service", { color: "green" }),
      node("c2", 1000, 320, "rectangle", "Email Service", { color: "blue" }),
    ],
    edges: [
      edge("e-p1-broker", "p1", "broker", "order.placed"),
      edge("e-p2-broker", "p2", "broker", "user.signup"),
      edge("e-p3-broker", "p3", "broker", "payment.succeeded"),
      edge("e-broker-q1", "broker", "q1"),
      edge("e-broker-q2", "broker", "q2"),
      edge("e-q1-c1", "q1", "c1"),
      edge("e-q2-c2", "q2", "c2"),
    ],
  },
  {
    id: "auth-flow",
    name: "Auth Flow",
    description: "Login, credential validation, session issuance, and access.",
    nodes: [
      node("login", 20, 100, "rectangle", "Login Form", { color: "blue" }),
      node("validate", 300, 140, "diamond", "Validate", {
        color: "orange",
      }),
      node("issue", 560, 40, "rectangle", "Issue JWT", { color: "purple" }),
      node("store", 560, 260, "cylinder", "Session Store", { color: "teal" }),
      node("gate", 860, 160, "diamond", "Authorized?", { color: "green" }),
      node("route", 1140, 160, "rectangle", "Protected Route", {
        color: "green",
      }),
      node("reject", 560, 420, "rectangle", "401 Unauthorized", {
        color: "red",
      }),
    ],
    edges: [
      edge("e-login-validate", "login", "validate"),
      edge("e-validate-issue", "validate", "issue", "valid"),
      edge("e-validate-reject", "validate", "reject", "invalid"),
      edge("e-issue-store", "issue", "store", "session"),
      edge("e-issue-gate", "issue", "gate", "token"),
      edge("e-store-gate", "store", "gate"),
      edge("e-gate-route", "gate", "route", "yes"),
      edge("e-gate-reject", "gate", "reject", "no"),
    ],
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    description: "A gateway fronting services with auth, routing, and limits.",
    nodes: [
      node("client", 20, 180, "circle", "Clients", { color: "blue" }),
      node("gateway", 280, 180, "hexagon", "API Gateway", { color: "purple" }),
      node("auth", 620, 0, "rectangle", "Auth", { color: "teal" }),
      node("router", 620, 160, "rectangle", "Router", { color: "orange" }),
      node("ratelimit", 620, 320, "rectangle", "Rate Limiter", {
        color: "red",
      }),
      node("svc1", 960, 0, "rectangle", "Service A", { color: "green" }),
      node("svc2", 960, 160, "rectangle", "Service B", { color: "blue" }),
      node("svc3", 960, 320, "rectangle", "Service C", { color: "pink" }),
      node("cache", 280, 420, "cylinder", "Cache", { color: "purple" }),
    ],
    edges: [
      edge("e-client-gw", "client", "gateway"),
      edge("e-gw-auth", "gateway", "auth"),
      edge("e-auth-gw", "auth", "gateway", "whoami"),
      edge("e-gw-router", "gateway", "router"),
      edge("e-gw-limited", "gateway", "ratelimit"),
      edge("e-limited-gw", "ratelimit", "gateway", "throttle"),
      edge("e-router-svc1", "router", "svc1"),
      edge("e-router-svc2", "router", "svc2"),
      edge("e-router-svc3", "router", "svc3"),
      edge("e-cache-router", "cache", "router", "cached"),
    ],
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    description: "Sliding-window rate limiting with a shared counter store.",
    nodes: [
      node("request", 20, 100, "pill", "Request", { color: "blue" }),
      node("identify", 300, 100, "rectangle", "Identify Client", {
        color: "purple",
      }),
      node("window", 580, 100, "diamond", "Within Limit?", {
        color: "orange",
      }),
      node("counters", 580, 320, "cylinder", "Counter Store", { color: "teal" }),
      node("allow", 900, 20, "pill", "Allow", { color: "green" }),
      node("reject", 900, 200, "pill", "Reject", { color: "red" }),
    ],
    edges: [
      edge("e-req-identify", "request", "identify"),
      edge("e-identify-window", "identify", "window"),
      edge("e-window-counters", "window", "counters", "fetched"),
      edge("e-counters-window", "counters", "window", "count"),
      edge("e-window-allow", "window", "allow", "yes"),
      edge("e-window-reject", "window", "reject", "no"),
    ],
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    description: "Visualize time-bucketed request counts sliding over time.",
    nodes: [
      text("title", 0, 0, "Sliding Window Log", 18),
      node("t1", 40, 120, "pill", "t-3s · 12 req", { color: "purple" }),
      node("t2", 300, 120, "pill", "t-2s · 7 req", { color: "blue" }),
      node("t3", 560, 120, "pill", "t-1s · 18 req", { color: "teal" }),
      node("t4", 820, 120, "pill", "now · 9 req", { color: "orange" }),
      node("evict", 560, 320, "rectangle", "Evict expired buckets", {
        color: "red",
      }),
      node("log", 820, 320, "cylinder", "Request Log", { color: "green" }),
    ],
    edges: [
      edge("e-t1-t2", "t1", "t2"),
      edge("e-t2-t3", "t2", "t3"),
      edge("e-t3-t4", "t3", "t4"),
      edge("e-t4-log", "t4", "log", "append"),
      edge("e-log-evict", "log", "evict"),
      edge("e-evict-t1", "evict", "t1", "drop"),
    ],
  },
  {
    id: "nextjs",
    name: "Next.js",
    description: "App Router request path through edge, React, and routes.",
    nodes: [
      node("browser", 20, 200, "circle", "Browser", { color: "blue" }),
      node("edge", 300, 40, "rectangle", "Edge Middleware", {
        color: "purple",
      }),
      node("server", 300, 200, "hexagon", "Server Components", {
        color: "green",
      }),
      node("client", 300, 380, "rectangle", "Client Components", {
        color: "teal",
      }),
      node("api", 680, 200, "rectangle", "Route Handlers", {
        color: "orange",
      }),
      node("db", 980, 200, "cylinder", "Database", { color: "red" }),
    ],
    edges: [
      edge("e-browser-edge", "browser", "edge"),
      edge("e-edge-server", "edge", "server", "RSC"),
      edge("e-edge-client", "edge", "client"),
      edge("e-server-client", "server", "client"),
      edge("e-server-api", "server", "api", "fetch"),
      edge("e-api-db", "api", "db", "SQL"),
      edge("e-db-api", "db", "api"),
    ],
  },
  {
    id: "nestjs",
    name: "NestJS",
    description: "Request lifecycle through guards, controllers, and services.",
    nodes: [
      node("req", 20, 200, "pill", "HTTP Request", { color: "blue" }),
      node("guards", 280, 40, "rectangle", "Guards", { color: "purple" }),
      node("controller", 280, 200, "rectangle", "Controller", {
        color: "green",
      }),
      node("service", 280, 360, "rectangle", "Service", { color: "orange" }),
      node("interceptors", 620, 40, "rectangle", "Interceptors", {
        color: "teal",
      }),
      node("repo", 620, 360, "rectangle", "Repository", { color: "pink" }),
      node("db", 940, 360, "cylinder", "Postgres", { color: "blue" }),
    ],
    edges: [
      edge("e-req-guards", "req", "guards"),
      edge("e-guards-controller", "guards", "controller", "auth"),
      edge("e-controller-service", "controller", "service", "useCase"),
      edge("e-controller-interceptors", "controller", "interceptors"),
      edge("e-interceptors-req", "interceptors", "req", "response"),
      edge("e-service-repo", "service", "repo"),
      edge("e-repo-db", "repo", "db", "SQL"),
    ],
  },
  {
    id: "payment-gateway",
    name: "Payment Gateway",
    description: "Checkout, provider interaction, verification, and capture.",
    nodes: [
      node("checkout", 20, 100, "rectangle", "Checkout", { color: "blue" }),
      node("provider", 300, 100, "rectangle", "Payment Provider", {
        color: "purple",
      }),
      node("verify", 580, 20, "diamond", "3DS Verify", { color: "orange" }),
      node("capture", 580, 200, "rectangle", "Capture", { color: "green" }),
      node("webhook", 860, 200, "rectangle", "Webhook", { color: "teal" }),
      node("order", 1140, 100, "pill", "Order Confirmed", { color: "green" }),
      node("reject", 580, 380, "pill", "Payment Failed", { color: "red" }),
    ],
    edges: [
      edge("e-checkout-provider", "checkout", "provider", "charge"),
      edge("e-provider-verify", "provider", "verify"),
      edge("e-verify-capture", "verify", "capture", "verified"),
      edge("e-verify-reject", "verify", "reject", "declined"),
      edge("e-capture-webhook", "capture", "webhook", "event"),
      edge("e-webhook-order", "webhook", "order"),
    ],
  },
];