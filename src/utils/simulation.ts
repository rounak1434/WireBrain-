import { Board, CanvasElement, Connector, SimulationScenario, SimulationStep } from '../types';

/**
 * Filter and validate simulation steps against the actual live elements and connectors on a board.
 * Any steps referencing deleted nodes are pruned, and connector IDs are reconciled.
 */
function validateAndPruneScenarios(
  scenarios: SimulationScenario[],
  board: Board
): SimulationScenario[] {
  const elementIdSet = new Set(board.elements.map((el) => el.id));
  const connectorIdSet = new Set(board.connectors.map((c) => c.id));

  const validScenarios: SimulationScenario[] = [];

  for (const sc of scenarios) {
    const validSteps: SimulationStep[] = [];

    for (const step of sc.steps) {
      // Must have both source and target nodes on the canvas
      if (!elementIdSet.has(step.sourceNodeId) || !elementIdSet.has(step.targetNodeId)) {
        continue;
      }

      // Check if connector still exists or find alternative connector
      let connId = step.connectorId;
      if (connId && !connectorIdSet.has(connId)) {
        const altConn = board.connectors.find(
          (c) => c.fromId === step.sourceNodeId && c.toId === step.targetNodeId
        );
        connId = altConn ? altConn.id : undefined;
      }

      validSteps.push({
        ...step,
        connectorId: connId,
        stepNumber: validSteps.length + 1,
      });
    }

    if (validSteps.length > 0) {
      validScenarios.push({
        ...sc,
        steps: validSteps,
      });
    }
  }

  return validScenarios;
}

/**
 * Predefined scenarios for known starter templates and example project boards.
 */
function getPredefinedScenarios(board: Board): SimulationScenario[] {
  const bId = board.id.toLowerCase();
  const bTitle = board.title.toLowerCase();

  // 1. System Architecture / Microservices
  if (bId.includes('system') || bId.includes('architecture') || bTitle.includes('system') || bTitle.includes('architecture')) {
    return [
      {
        id: 'scenario-auth',
        title: 'User Authentication & JWT Validation',
        description: 'Client authenticates via API Gateway, issues token via Go Auth Service, and caches session.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'sys-web-client',
            targetNodeId: 'sys-gateway',
            connectorId: 'conn-web-gw',
            title: 'Client Request (HTTPS)',
            description: 'Web client initiates secure TLS request to ingress gateway.',
            protocol: 'HTTPS / TLS 1.3 (Port 443)',
            payload: 'POST /api/v1/auth/login { "email": "alex@corp.internal" }',
            response: 'TCP Handshake OK',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'sys-gateway',
            targetNodeId: 'sys-auth-svc',
            connectorId: 'conn-gw-auth',
            title: 'Validate Credentials',
            description: 'Gateway forwards credentials to Auth Service over private VPC.',
            protocol: 'gRPC Internal (Port 9090)',
            payload: 'VerifyPasswordHash(email, salt)',
            response: '200 OK — Password verified',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'sys-gateway',
            targetNodeId: 'sys-core-svc',
            connectorId: 'conn-gw-core',
            title: 'Route to Core API',
            description: 'Gateway injects verified JWT header and proxies session request.',
            protocol: 'HTTP/2 Internal (Port 8080)',
            payload: 'X-User-ID: usr_8921; X-Role: admin',
            response: 'Core API accepts request',
          },
          {
            stepNumber: 4,
            sourceNodeId: 'sys-core-svc',
            targetNodeId: 'sys-cache',
            connectorId: 'conn-core-cache',
            title: 'Session Cache Write',
            description: 'Core API sets warm session entry into Redis cluster.',
            protocol: 'RESP Protocol (Port 6379)',
            payload: 'SET session:usr_8921 { ttl: 3600 }',
            response: '+OK (0.4ms latency)',
          },
        ],
      },
      {
        id: 'scenario-telemetry',
        title: 'Event Telemetry & Storage Ingestion',
        description: 'Core API publishes telemetry to Kafka event bus, worker processes batches into S3.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'sys-mobile-client',
            targetNodeId: 'sys-gateway',
            connectorId: 'conn-mob-gw',
            title: 'Mobile Event Stream',
            description: 'Mobile client streams batch of user actions to gateway.',
            protocol: 'gRPC-Web (HTTP/2)',
            payload: 'PublishTelemetryBatch(size: 24 events)',
            response: 'ACK Received',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'sys-gateway',
            targetNodeId: 'sys-core-svc',
            connectorId: 'conn-gw-core',
            title: 'Internal Ingress',
            description: 'Gateway proxies batch to Core API ingestion pipeline.',
            protocol: 'Internal Proxy',
            payload: 'Batch size: 4.8 KB',
            response: 'Enqueued',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'sys-core-svc',
            targetNodeId: 'sys-queue',
            connectorId: 'conn-core-queue',
            title: 'Publish to Kafka Event Bus',
            description: 'Core API writes partitioned event messages to Kafka cluster.',
            protocol: 'Kafka TCP (Port 9092)',
            payload: 'PRODUCE topic=events partition=2',
            response: 'Offset 84920 commit OK',
          },
          {
            stepNumber: 4,
            sourceNodeId: 'sys-queue',
            targetNodeId: 'sys-worker',
            connectorId: 'conn-queue-worker',
            title: 'Worker Poll & Consumption',
            description: 'Async task worker consumes messages and bundles artifacts.',
            protocol: 'Kafka Consumer Group',
            payload: 'POLL batch max=100',
            response: 'Processed 100 items',
          },
          {
            stepNumber: 5,
            sourceNodeId: 'sys-worker',
            targetNodeId: 'sys-cloud-s3',
            connectorId: 'conn-worker-s3',
            title: 'Object Storage Archival',
            description: 'Worker uploads compressed telemetry archive to AWS S3 bucket.',
            protocol: 'AWS S3 REST API (HTTPS)',
            payload: 'PUT /bucket/telemetry/2026/10/14.parquet',
            response: 'HTTP 200 OK — ETag verified',
          },
        ],
      },
      {
        id: 'scenario-db-read',
        title: 'Read-Through Cache & PostgreSQL Fallback',
        description: 'Core API attempts cache check, falls back to primary SQL database.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'sys-web-client',
            targetNodeId: 'sys-gateway',
            connectorId: 'conn-web-gw',
            title: 'Data Query Request',
            description: 'Web client requests customer telemetry report.',
            protocol: 'HTTPS GET /api/v1/metrics',
            payload: 'Header Authorization: Bearer <jwt>',
            response: 'Authorized',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'sys-gateway',
            targetNodeId: 'sys-core-svc',
            connectorId: 'conn-gw-core',
            title: 'Forward to Core API',
            description: 'Core API prepares query execution plan.',
            protocol: 'Internal Service Mesh',
            payload: 'Query customer_id=8921',
            response: 'Processing',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'sys-core-svc',
            targetNodeId: 'sys-cache',
            connectorId: 'conn-core-cache',
            title: 'Cache Lookup (Redis)',
            description: 'Check in-memory cache for existing summary.',
            protocol: 'Redis GET key',
            payload: 'GET metrics:customer:8921',
            response: 'Cache Miss (nil)',
          },
          {
            stepNumber: 4,
            sourceNodeId: 'sys-core-svc',
            targetNodeId: 'sys-postgres',
            connectorId: 'conn-core-db',
            title: 'Database Read (PostgreSQL)',
            description: 'Execute optimized SQL query against PostgreSQL replica.',
            protocol: 'PostgreSQL Wire (Port 5432)',
            payload: 'SELECT * FROM metrics WHERE customer_id = 8921 LIMIT 50;',
            response: '50 rows returned in 2.1ms',
          },
        ],
      },
    ];
  }

  // 2. Cloud Infrastructure & Database (AWS Multi-AZ)
  if (bId.includes('infra') || bTitle.includes('infra') || bTitle.includes('cloud')) {
    return [
      {
        id: 'scenario-infra-ingress',
        title: 'Internet Ingress & Application Load Balancer Routing',
        description: 'Client connects via Internet Gateway; ALB distributes request to healthy EKS worker pods.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'infra-igw',
            targetNodeId: 'infra-alb',
            connectorId: 'conn-infra-igw-alb',
            title: 'TLS Termination at ALB',
            description: 'Internet Gateway forwards external traffic to AWS Application Load Balancer.',
            protocol: 'HTTPS / TLS 1.3 (Port 443)',
            payload: 'GET /api/v2/orders { Host: api.wirebrain.io }',
            response: '200 ALB Health: OK',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'infra-alb',
            targetNodeId: 'infra-eks-pod-1',
            connectorId: 'conn-infra-alb-pod1',
            title: 'Forward to EKS Pod AZ-A',
            description: 'ALB evaluates target group health and proxies to active Kubernetes pod.',
            protocol: 'HTTP/1.1 Private VPC (Port 8080)',
            payload: 'X-Forwarded-For: 198.51.100.24',
            response: 'Pod 1 (Ready, CPU 18%)',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'infra-eks-pod-1',
            targetNodeId: 'infra-db-master',
            connectorId: 'conn-infra-pod1-db',
            title: 'Aurora PostgreSQL Primary Write',
            description: 'App container executes transaction on Aurora Multi-AZ writer instance.',
            protocol: 'PostgreSQL SSL (Port 5432)',
            payload: 'INSERT INTO orders (id, amount) VALUES (9182, 49.00);',
            response: 'COMMIT (1.2ms)',
          },
          {
            stepNumber: 4,
            sourceNodeId: 'infra-db-master',
            targetNodeId: 'infra-db-replica',
            connectorId: 'conn-infra-db-repl',
            title: 'Synchronous Storage Replication',
            description: 'Aurora storage engine replicates write log across 3 Availability Zones.',
            protocol: 'Aurora Shared Storage Engine',
            payload: 'Sync WAL chunk block #402910',
            response: 'Quorum ACK 6/6 nodes',
          },
        ],
      },
      {
        id: 'scenario-infra-telemetry',
        title: 'Observability & Metrics Aggregation',
        description: 'EKS worker pod streams health and APM traces to CloudWatch & Prometheus.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'infra-eks-pod-2',
            targetNodeId: 'infra-redis-cluster',
            connectorId: 'conn-infra-pod2-redis',
            title: 'Distributed Session Query',
            description: 'Pod checks ElastiCache Redis replication group for tenant lock.',
            protocol: 'Redis RESP (Port 6379)',
            payload: 'GET lock:tenant_492',
            response: '+OK (0.3ms)',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'infra-eks-pod-2',
            targetNodeId: 'infra-cloudwatch',
            connectorId: 'conn-infra-pod2-cw',
            title: 'Telemetry Export',
            description: 'Otel daemon exports p99 latency and error logs to CloudWatch Logs.',
            protocol: 'CloudWatch PutMetricData (HTTPS)',
            payload: 'Metrics: { p99: 14ms, req_count: 8200 }',
            response: '200 Metric Ingested',
          },
        ],
      },
    ];
  }

  // 3. User Journey / KYC Flowchart
  if (bId.includes('flowchart') || bTitle.includes('flowchart') || bTitle.includes('kyc')) {
    return [
      {
        id: 'scenario-flow-approved',
        title: 'KYC Fast-Track Approval Path',
        description: 'Complete flow from submission to automated document scan, pass score, and account activation.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'flow-start',
            targetNodeId: 'flow-step-scan',
            connectorId: 'conn-flow-start-scan',
            title: 'Application Intake',
            description: 'User submits personal credentials and government ID photo.',
            protocol: 'Form Submission Event',
            payload: 'ID Type: Passport; Jurisdiction: US',
            response: 'Queued for OCR processing',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'flow-step-scan',
            targetNodeId: 'flow-decision-score',
            connectorId: 'conn-flow-scan-score',
            title: 'OCR & Biometric Liveness Check',
            description: 'Computer vision engine verifies facial match and holographic authenticity.',
            protocol: 'ML Inference Pipeline',
            payload: 'Confidence: 99.4%; Liveness: Verified',
            response: 'Risk Score Calculated: 12 (Low)',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'flow-decision-score',
            targetNodeId: 'flow-step-account-ready',
            connectorId: 'conn-flow-score-approved',
            title: 'Decision Diamond: Score < 25 (Approved)',
            description: 'Risk score is well below compliance threshold; bypasses manual analyst review.',
            protocol: 'Decision Outcome',
            payload: 'Risk Status: Low Risk (Auto-approved)',
            response: 'Route to Account Provisioning',
            decisionCondition: 'Risk Score < 25?',
            decisionOutcome: 'Yes (Instant Approval)',
          },
          {
            stepNumber: 4,
            sourceNodeId: 'flow-step-account-ready',
            targetNodeId: 'flow-end-success',
            connectorId: 'conn-flow-ready-end',
            title: 'Activate Account & Issue Notification',
            description: 'Provision database record, create secure wallet, and send welcome SMS.',
            protocol: 'Webhook & Push Notification',
            payload: 'Account ID: acc_98124; Status: ACTIVE',
            response: 'User Journey Complete',
          },
        ],
      },
      {
        id: 'scenario-flow-manual-review',
        title: 'KYC Compliance Analyst Manual Review Branch',
        description: 'High risk score or ambiguous document triggers secondary manual review by compliance officer.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'flow-start',
            targetNodeId: 'flow-step-scan',
            connectorId: 'conn-flow-start-scan',
            title: 'Application Intake',
            description: 'Applicant submits identity documentation with minor glare.',
            protocol: 'Form Submission Event',
            payload: 'ID Type: Driver License',
            response: 'Queued for OCR processing',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'flow-step-scan',
            targetNodeId: 'flow-decision-score',
            connectorId: 'conn-flow-scan-score',
            title: 'Automated Scoring Inspection',
            description: 'Automated scanner flags address discrepancy.',
            protocol: 'Risk Engine',
            payload: 'Score: 68 (Medium-High Risk)',
            response: 'Decision required',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'flow-decision-score',
            targetNodeId: 'flow-step-manual-review',
            connectorId: 'conn-flow-score-review',
            title: 'Decision Diamond: Ambiguous Risk',
            description: 'Score exceeds automated threshold; case routed to human compliance queue.',
            protocol: 'Internal Ticket Dispatch',
            payload: 'Case #KYC-4091 enqueued to Tier 2 Analyst',
            response: 'Assigned to Analyst Rachel',
            decisionCondition: 'Risk Score < 25?',
            decisionOutcome: 'No (Escalate)',
          },
          {
            stepNumber: 4,
            sourceNodeId: 'flow-step-manual-review',
            targetNodeId: 'flow-step-account-ready',
            connectorId: 'conn-flow-review-approved',
            title: 'Analyst Approves Case',
            description: 'Analyst reviews secondary utility bill and overrides risk flag.',
            protocol: 'Analyst Sign-off',
            payload: 'Resolution: APPROVED; Operator: usr_analyst_12',
            response: 'Proceed to Account Activation',
          },
          {
            stepNumber: 5,
            sourceNodeId: 'flow-step-account-ready',
            targetNodeId: 'flow-end-success',
            connectorId: 'conn-flow-ready-end',
            title: 'Account Provisioned',
            description: 'User receives notification and access to platform.',
            protocol: 'System Completion',
            payload: 'Status: ACTIVE',
            response: 'Complete',
          },
        ],
      },
    ];
  }

  // 4. Mobile App: Starter Board (Mobile Ops Dashboard)
  if (bId === 'board-mobile' || (bId.includes('mobile') && board.elements.some((e) => e.id === 'mob-frame-1'))) {
    return [
      {
        id: 'scenario-mobile-ops',
        title: 'Ops Diagnostics & Telemetry Navigation Flow',
        description: 'User triggers automated diagnostics from Ops Dashboard, reviews live cluster telemetry, and returns to main view.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'mob-action-btn',
            targetNodeId: 'mob-frame-2',
            connectorId: 'mob-conn-1',
            title: 'Trigger Diagnostics Suite',
            description: "User taps '+ Trigger Automated Diagnostics' on Ops Dashboard, transitioning to the Diagnostics & Telemetry screen.",
            protocol: 'Prototype Navigation Action',
            payload: 'Navigate: mob-frame-2 (Diagnostics & Telemetry)',
            response: 'Rendered Diagnostics & Telemetry Screen',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'mob-2-rerun-btn',
            targetNodeId: 'mob-2-status-card',
            title: 'Live Health Checks Verification',
            description: 'Diagnostic suite checks TLS handshake, Kafka message buffer, and Redis cluster replication.',
            protocol: 'Diagnostics Probe',
            payload: '4 regional clusters evaluated',
            response: '100% Nominal · 0 errors',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'mob-2-back-btn',
            targetNodeId: 'mob-frame-1',
            connectorId: 'mob-conn-2',
            title: 'Return to Ops Dashboard',
            description: "User taps '← Back' to return to the main System Health Monitor dashboard.",
            protocol: 'Prototype Navigation Back',
            payload: 'Navigate: mob-frame-1 (Ops Dashboard)',
            response: 'Restored Ops Dashboard',
          },
        ],
      },
    ];
  }

  // 5. Mobile App: Fintech Wallet Example
  if (bId === 'board-example-mobile' || bId.includes('mobile') || bTitle.includes('mobile') || bTitle.includes('wallet')) {
    return [
      {
        id: 'scenario-mobile-wallet',
        title: 'Biometric Login & Wallet Dashboard Flow',
        description: 'User authenticates with FaceID on Screen 1, navigates to Wallet Dashboard, triggers Send modal, and locks session.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'mob-1-login-btn',
            targetNodeId: 'mob-screen-2',
            connectorId: 'conn-mob-login-dash',
            title: 'Biometric FaceID Login Handshake',
            description: 'User authenticates with FaceID on Screen 1 and navigates to Screen 2: Wallet Dashboard.',
            protocol: 'Biometric Auth Event',
            payload: 'FaceID Verified; Session JWT issued',
            response: 'Transitioned to Screen 2: Wallet Dashboard',
          },
          {
            stepNumber: 2,
            sourceNodeId: 'mob-2-action-send',
            targetNodeId: 'mob-screen-2',
            title: 'Trigger Send Transfer Modal',
            description: "User taps '↑ Send' action button, opening the peer-to-peer transfer sheet.",
            protocol: 'Prototype Modal Action',
            payload: 'Open modal: Send Cryptocurrency / Fiat Transfer Sheet',
            response: 'Transfer sheet modal displayed',
          },
          {
            stepNumber: 3,
            sourceNodeId: 'mob-2-lock-btn',
            targetNodeId: 'mob-screen-1',
            connectorId: 'conn-mob-lock-login',
            title: 'Lock Session & Sign Out',
            description: "User taps '← Lock' button to secure the wallet and return to the biometric authentication screen.",
            protocol: 'Session Termination',
            payload: 'Clear session token; Return to /login',
            response: 'Returned to Screen 1: Biometric Login',
          },
        ],
      },
    ];
  }

  // 6. Website Wireframes (Starter and Example)
  if (bId.includes('website') || bTitle.includes('website')) {
    const hasHeroPricing = board.elements.some((e) => e.id === 'web-hero-cta' && board.elements.some((el) => el.id === 'web-pricing-btn'));
    if (hasHeroPricing) {
      return [
        {
          id: 'scenario-website-checkout',
          title: 'SaaS Marketing & Checkout Flow',
          description: 'Visitor navigates from hero CTA down to pricing banner and opens the interactive workspace checkout modal.',
          steps: [
            {
              stepNumber: 1,
              sourceNodeId: 'web-hero-cta',
              targetNodeId: 'web-pricing-btn',
              connectorId: 'conn-web-cta-pricing',
              title: 'Hero CTA Navigation',
              description: "Visitor clicks 'Start Building Free' hero CTA, directing focus to the pricing tier banner.",
              protocol: 'Smooth Scroll Anchor',
              payload: 'ScrollTarget: #pricing-section',
              response: 'Pricing Banner in view',
            },
            {
              stepNumber: 2,
              sourceNodeId: 'web-pricing-btn',
              targetNodeId: 'web-frame-1',
              title: 'Open Interactive Checkout Modal',
              description: "User clicks 'Start Free Project' button, opening the checkout dialog sheet.",
              protocol: 'Prototype Modal Action',
              payload: 'Open modal: New Architecture Workspace Modal',
              response: 'Checkout dialog displayed',
            },
          ],
        },
      ];
    }

    return [
      {
        id: 'scenario-website-workspace',
        title: 'Landing Page Workspace Modal Flow',
        description: 'Visitor clicks primary CTA on landing page to open the workspace modal sheet.',
        steps: [
          {
            stepNumber: 1,
            sourceNodeId: 'web-hero-btn1',
            targetNodeId: 'web-frame-1',
            title: 'Hero CTA Interaction',
            description: "Visitor clicks 'Create Workspace' on the desktop landing page.",
            protocol: 'Prototype Modal Action',
            payload: 'Open modal: Create Architecture Workspace Modal',
            response: 'Modal sheet active',
          },
        ],
      },
    ];
  }

  return [];
}

/**
 * Intelligent graph route generator that traverses actual board connectors and nodes.
 * Automatically generates multi-step paths for any custom diagram, including decision branches.
 */
function generateDynamicScenariosFromGraph(board: Board): SimulationScenario[] {
  const elementsById = new Map<string, CanvasElement>(board.elements.map((el) => [el.id, el]));
  const hasFrames = board.elements.some((e) => e.type.startsWith('frame'));

  function isAnnotationElement(el: CanvasElement): boolean {
    const l = (el.label || '').toLowerCase();
    return (
      el.type === 'text' ||
      l.includes('spec') ||
      l.includes('annotation') ||
      l.includes('note') ||
      l.includes('legend')
    );
  }

  // Valid connectors connecting existing elements (excluding connectors pointing into annotation notes when frames exist)
  const validConnectors = board.connectors.filter((c) => {
    const fromEl = elementsById.get(c.fromId);
    const toEl = elementsById.get(c.toId);
    if (!fromEl || !toEl) return false;
    if (hasFrames && isAnnotationElement(toEl)) return false;
    return true;
  });

  if (validConnectors.length === 0) {
    return [];
  }

  // Build graph adjacency
  const outEdges = new Map<string, Array<{ connector: Connector; targetId: string }>>();
  const inDegree = new Map<string, number>();

  for (const conn of validConnectors) {
    if (!outEdges.has(conn.fromId)) {
      outEdges.set(conn.fromId, []);
    }
    outEdges.get(conn.fromId)!.push({ connector: conn, targetId: conn.toId });
    inDegree.set(conn.toId, (inDegree.get(conn.toId) || 0) + 1);
  }

  // Find root nodes (inDegree === 0)
  const allConnectedNodeIds = new Set<string>();
  for (const conn of validConnectors) {
    allConnectedNodeIds.add(conn.fromId);
    allConnectedNodeIds.add(conn.toId);
  }

  let rootNodeIds = Array.from(allConnectedNodeIds).filter((id) => (inDegree.get(id) || 0) === 0);

  // If no root node (e.g. cycle), pick nodes that have outgoing edges
  if (rootNodeIds.length === 0) {
    rootNodeIds = Array.from(outEdges.keys()).slice(0, 3);
  }

  // Trace paths using DFS
  interface PathStep {
    fromId: string;
    toId: string;
    connector: Connector;
  }

  const generatedPaths: PathStep[][] = [];

  function dfs(currId: string, currentPath: PathStep[], visitedNodes: Set<string>, depth: number) {
    if (depth > 12) {
      if (currentPath.length > 0) generatedPaths.push([...currentPath]);
      return;
    }

    const edges = outEdges.get(currId) || [];
    if (edges.length === 0) {
      if (currentPath.length > 0) {
        generatedPaths.push([...currentPath]);
      }
      return;
    }

    for (const edge of edges) {
      if (visitedNodes.has(edge.targetId)) {
        // Cycle detected: record current path and don't loop infinitely
        const cyclicPath = [...currentPath, { fromId: currId, toId: edge.targetId, connector: edge.connector }];
        generatedPaths.push(cyclicPath);
        continue;
      }

      visitedNodes.add(edge.targetId);
      currentPath.push({ fromId: currId, toId: edge.targetId, connector: edge.connector });

      dfs(edge.targetId, currentPath, visitedNodes, depth + 1);

      currentPath.pop();
      visitedNodes.delete(edge.targetId);
    }
  }

  for (const rootId of rootNodeIds) {
    const visited = new Set<string>([rootId]);
    dfs(rootId, [], visited, 0);
  }

  // If DFS yielded no paths (e.g. isolated edges), build direct edge paths
  if (generatedPaths.length === 0) {
    const fallbackPath: PathStep[] = validConnectors.map((c) => ({
      fromId: c.fromId,
      toId: c.toId,
      connector: c,
    }));
    generatedPaths.push(fallbackPath);
  }

  // Deduplicate and filter paths: keep top 4 most interesting distinct paths
  const sortedPaths = generatedPaths
    .filter((p) => p.length > 0)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);

  const dynamicScenarios: SimulationScenario[] = [];

  for (let pIdx = 0; pIdx < sortedPaths.length; pIdx++) {
    const path = sortedPaths[pIdx];
    const firstEl = elementsById.get(path[0].fromId);
    const lastEl = elementsById.get(path[path.length - 1].toId);

    const startLabel = firstEl?.label || 'Origin';
    const endLabel = lastEl?.label || 'Destination';

    // Check if any diamond decision node is traversed
    const decisionStep = path.find((st) => {
      const el = elementsById.get(st.fromId);
      return el?.type === 'diamond' || (st.connector.label && ['yes', 'no', 'true', 'false', 'approved', 'rejected'].includes(st.connector.label.toLowerCase()));
    });

    const isWireframeHop = hasFrames && (firstEl?.type.startsWith('frame') || lastEl?.type.startsWith('frame') || firstEl?.type === 'button');

    let scenarioTitle = isWireframeHop
      ? `Screen Flow: ${startLabel} → ${endLabel}`
      : `Flow: ${startLabel} → ${endLabel}`;

    if (decisionStep && decisionStep.connector.label) {
      scenarioTitle = `Branch [${decisionStep.connector.label}]: ${startLabel} → ${endLabel}`;
    }

    const steps: SimulationStep[] = path.map((st, sIdx) => {
      const fromEl = elementsById.get(st.fromId)!;
      const toEl = elementsById.get(st.toId)!;
      const isDecision = fromEl.type === 'diamond';
      const stepIsWireframe = hasFrames && (fromEl.type.startsWith('frame') || toEl.type.startsWith('frame') || fromEl.type === 'button');

      return {
        stepNumber: sIdx + 1,
        sourceNodeId: fromEl.id,
        targetNodeId: toEl.id,
        connectorId: st.connector.id,
        title: st.connector.label
          ? `${fromEl.label || 'Node'} → ${toEl.label || 'Node'} (${st.connector.label})`
          : stepIsWireframe
          ? `Screen Transition: ${fromEl.label || 'Screen'} → ${toEl.label || 'Screen'}`
          : `Hop ${sIdx + 1}: ${fromEl.label || 'Node'} → ${toEl.label || 'Node'}`,
        description: isDecision
          ? `Evaluating conditional branch "${fromEl.label || 'Decision'}". Route selected: ${st.connector.label || 'next transition'}.`
          : stepIsWireframe
          ? `Interactive prototype navigation from "${fromEl.label || 'Screen'}" to "${toEl.label || 'Screen'}".`
          : `Dispatched message from "${fromEl.label || 'Node'}" to "${toEl.label || 'Node'}".`,
        protocol: st.connector.label || (stepIsWireframe ? 'UI Prototype Navigation' : fromEl.type === 'database' ? 'SQL / TCP' : fromEl.type === 'service' ? 'gRPC / HTTP' : 'Direct Link'),
        payload: stepIsWireframe ? `Transition to ${toEl.label || 'Target Screen'}` : `Event dispatched from ${fromEl.label || 'Source'}`,
        response: stepIsWireframe ? `Rendered ${toEl.label || 'Target Screen'}` : `Acknowledged by ${toEl.label || 'Target'}`,
        decisionCondition: isDecision ? fromEl.label : undefined,
        decisionOutcome: isDecision ? (st.connector.label || 'Condition Met') : undefined,
      };
    });

    dynamicScenarios.push({
      id: `scenario-dynamic-${pIdx + 1}`,
      title: scenarioTitle,
      description: isWireframeHop
        ? `Prototype screen transition through ${path.length} connection transitions on canvas.`
        : `Step-by-step route traversal through ${path.length} connection transitions on canvas.`,
      steps,
    });
  }

  return dynamicScenarios;
}

/**
 * Main entry point: Retrieves active simulation scenarios for any given board.
 * Combines validated template scenarios with dynamic topological graph routes.
 */
export function getScenariosForBoard(board: Board): SimulationScenario[] {
  // 1. Get predefined scenarios if applicable
  const predefined = getPredefinedScenarios(board);
  const validatedPredefined = validateAndPruneScenarios(predefined, board);

  // 2. Generate dynamic topological routes from canvas connectors
  const dynamicScenarios = generateDynamicScenariosFromGraph(board);

  // If validated predefined scenarios exist, combine them with any novel dynamic routes
  if (validatedPredefined.length > 0) {
    // Return predefined plus any extra dynamic scenario if relevant
    return validatedPredefined;
  }

  // If dynamic scenarios found
  if (dynamicScenarios.length > 0) {
    return dynamicScenarios;
  }

  // Fallback when no connectors exist on canvas
  return [
    {
      id: 'scenario-empty',
      title: 'No Connected Routes Found',
      description: 'Connect elements on the canvas using arrows (C) to generate an automated data flow.',
      steps: [],
    },
  ];
}
