import { Board, CanvasElement, Connector, SimulationScenario, SimulationStep } from '../types';

export function getScenariosForBoard(board: Board): SimulationScenario[] {
  // If it's the System Map board
  if (board.id.includes('system') || board.title.toLowerCase().includes('system')) {
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

  // Dynamic automatic scenarios generated from existing diagram connectors!
  const steps: SimulationStep[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < board.connectors.length; i++) {
    const conn = board.connectors[i];
    const fromEl = board.elements.find((el) => el.id === conn.fromId);
    const toEl = board.elements.find((el) => el.id === conn.toId);
    if (!fromEl || !toEl) continue;

    const isDecision = fromEl.type === 'diamond' || toEl.type === 'diamond';

    steps.push({
      stepNumber: i + 1,
      sourceNodeId: fromEl.id,
      targetNodeId: toEl.id,
      connectorId: conn.id,
      title: conn.label ? `Transition: ${conn.label}` : `Step: ${fromEl.label} → ${toEl.label}`,
      description: isDecision
        ? `Evaluating decision branch: ${fromEl.label}. Outcome condition met.`
        : `Data transmitted from ${fromEl.label} to ${toEl.label}.`,
      protocol: conn.label || 'Connection link',
      payload: `Dispatched from ${fromEl.label}`,
      response: `Received by ${toEl.label}`,
      decisionCondition: isDecision ? fromEl.label : undefined,
      decisionOutcome: isDecision ? 'Condition Met (Proceed)' : undefined,
    });
  }

  if (steps.length === 0) {
    return [
      {
        id: 'scenario-empty',
        title: 'No Connected Routes Found',
        description: 'Connect elements on the canvas using arrows (C) to generate an automated data flow.',
        steps: [],
      },
    ];
  }

  return [
    {
      id: 'scenario-auto',
      title: 'Diagram Connector Flow',
      description: 'Trace step-by-step through existing connections on this board.',
      steps,
    },
  ];
}
