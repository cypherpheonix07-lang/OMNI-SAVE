export type FrontierDomainId =
  | 'ai_deep_tech'
  | 'quantum_tech'
  | 'neuro_engineering'
  | 'bio_engineering'
  | 'robotics_autonomous';

export type CapabilityStatus =
  | 'IMPLEMENTED AND VERIFIED'
  | 'IMPLEMENTED BUT UNVERIFIED'
  | 'CONFIGURATION REQUIRED'
  | 'UNSUPPORTED IN CURRENT ENVIRONMENT';

export type SimulationCapabilityMode =
  | 'interactive_3d'
  | 'kinematic_simulation'
  | 'physics_simulation'
  | 'recorded_demo'
  | 'live_telemetry'
  | 'unavailable';

export type FreshnessStatus =
  | 'Live Connected'
  | 'Fresh'
  | 'Polling Active'
  | 'Delayed'
  | 'Source Error'
  | 'Offline Cached';

export type UserRole = 'Owner' | 'Administrator' | 'Member';

export interface ProvenanceTimestamps {
  publishedAt: string | null;
  sourceUpdatedAt: string | null;
  firstSeenAt: string;
  lastFetchedAt: string;
  lastSuccessfulFetchAt: string | null;
  processedAt: string;
  publishedToFeedAt: string;
}

export interface CitationSource {
  id: string;
  title: string;
  url: string;
  provider: 'arXiv' | 'OpenAlex' | 'Crossref' | 'GitHub' | 'WebSearch' | 'Institutional';
  doi?: string;
  arxivId?: string;
  publishedDate?: string | null;
  verified: boolean;
}

export interface ResearchItem {
  id: string;
  canonicalKey: string;
  title: string;
  domain: FrontierDomainId;
  domainLabel: string;
  recordType: 'Paper' | 'Preprint' | 'Hardware Prototype' | 'Open-Source Release' | 'Dataset';
  summary: string;
  methodology: string;
  keyFindings: string[];
  limitations: string[];
  countryCode: string;
  countryName: string;
  institutionId: string;
  institutionName: string;
  laboratoryName: string;
  authors: { id: string; name: string; affiliation: string; orcid?: string }[];
  doi: string | null;
  arxivId: string | null;
  repositoryUrl: string | null;
  sourceUrl: string;
  sourceProvider: 'arXiv' | 'OpenAlex' | 'GitHub' | 'Crossref';
  maturityLevel: 'Theoretical' | 'Lab Prototype' | 'Clinical / Field Trial' | 'Production Ready';
  has3dModel: boolean;
  hasSimulation: boolean;
  hasCodeDemo: boolean;
  simulationId?: string;
  modelPartsCount?: number;
  metrics: {
    citationCount: number;
    reproducibilityScore: number; // 0-100
    noveltyIndex: number; // 0-100
    benchmarkGainPct?: number;
  };
  provenance: ProvenanceTimestamps;
  tags: string[];
  citations: CitationSource[];
}

export interface ResearchInstitution {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  city: string;
  coordinates: { lat: number; lng: number };
  primaryDomains: FrontierDomainId[];
  laboratories: string[];
  activeProjectsCount: number;
  publicationCount: number;
  leadResearchers: string[];
  website: string;
}

export interface SourceConnector {
  id: string;
  name: string;
  provider: 'arXiv' | 'OpenAlex' | 'GitHub' | 'Crossref';
  endpointUrl: string;
  domain: FrontierDomainId;
  query: string;
  pollingIntervalMinutes: number;
  status: 'healthy' | 'degraded' | 'error' | 'idle';
  lastFetchedAt: string | null;
  lastSuccessfulFetchAt: string | null;
  recordsIngested: number;
  duplicatesSkipped: number;
  errorCount: number;
  lastError?: string | null;
}

export interface IngestionJobRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  fetchedCount: number;
  insertedCount: number;
  deduplicatedCount: number;
  durationMs: number;
  triggeredBy: string;
  errorMessage?: string;
}

export interface CapabilityMatrixEntry {
  id: string;
  subsystem: string;
  category: 'Frontend' | 'Backend' | 'Database & Auth' | 'Real-Time & Ingestion' | '3D & Simulation' | 'AI & Grounding' | 'Security';
  status: CapabilityStatus;
  evidence: string;
  notes: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingEnabled?: boolean;
  citations?: CitationSource[];
  inferredClaims?: string[];
  missingEvidence?: string[];
}
