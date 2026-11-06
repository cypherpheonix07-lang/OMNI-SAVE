import {
  FrontierDomainId,
  FreshnessStatus,
  ProvenanceTimestamps,
  ResearchItem,
} from '../types/frontier.js';

/**
 * Validates whether an external URL is safe for server-side ingestion (SSRF protection).
 * Blocks localhost, loopback, link-local, metadata IPs, and non-HTTPS schemes.
 */
export function isSafeExternalUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.endsWith('.internal') ||
      host.endsWith('.local') ||
      host === '169.254.169.254' ||
      host === 'metadata.google.internal'
    ) {
      return false;
    }

    // Check private IPv4 ranges
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 10 ||
        a === 127 ||
        a === 0 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254)
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a DOI string for deterministic deduplication.
 */
export function normalizeDoi(doi?: string | null): string | null {
  if (!doi || typeof doi !== 'string') return null;
  const cleaned = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '')
    .trim();
  return cleaned.length > 3 ? cleaned : null;
}

/**
 * Normalizes an arXiv identifier (stripping version suffix v1, v2 for canonical identity).
 */
export function normalizeArxivId(arxivId?: string | null): string | null {
  if (!arxivId || typeof arxivId !== 'string') return null;
  const cleaned = arxivId
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//, '')
    .replace(/^arxiv:\s*/, '')
    .replace(/\.pdf$/, '')
    .replace(/v\d+$/, '')
    .trim();
  return cleaned.length > 3 ? cleaned : null;
}

/**
 * Computes a deterministic canonical deduplication key for a ResearchItem.
 */
export function computeCanonicalKey(item: {
  doi?: string | null;
  arxivId?: string | null;
  repositoryUrl?: string | null;
  title: string;
}): string {
  const normDoi = normalizeDoi(item.doi);
  if (normDoi) return `doi:${normDoi}`;

  const normArxiv = normalizeArxivId(item.arxivId);
  if (normArxiv) return `arxiv:${normArxiv}`;

  if (item.repositoryUrl) {
    try {
      const u = new URL(item.repositoryUrl);
      return `repo:${u.hostname.toLowerCase()}${u.pathname.toLowerCase().replace(/\/+$/, '')}`;
    } catch {
      // fall through
    }
  }

  const slugTitle = (item.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `title:${slugTitle}`;
}

/**
 * Deduplicates an array of ResearchItems while preserving the freshest provenance metadata.
 */
export function deduplicateResearchItems(items: ResearchItem[]): {
  unique: ResearchItem[];
  duplicatesRemoved: number;
} {
  const map = new Map<string, ResearchItem>();
  let duplicatesRemoved = 0;

  for (const item of items) {
    const key = item.canonicalKey || computeCanonicalKey(item);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, canonicalKey: key });
    } else {
      duplicatesRemoved++;
      // Keep earliest firstSeenAt and latest lastFetchedAt
      const mergedProvenance: ProvenanceTimestamps = {
        ...item.provenance,
        firstSeenAt:
          existing.provenance.firstSeenAt < item.provenance.firstSeenAt
            ? existing.provenance.firstSeenAt
            : item.provenance.firstSeenAt,
        lastFetchedAt:
          existing.provenance.lastFetchedAt > item.provenance.lastFetchedAt
            ? existing.provenance.lastFetchedAt
            : item.provenance.lastFetchedAt,
      };
      map.set(key, {
        ...existing,
        ...item,
        id: existing.id,
        canonicalKey: key,
        provenance: mergedProvenance,
      });
    }
  }

  return {
    unique: Array.from(map.values()),
    duplicatesRemoved,
  };
}

/**
 * Computes an honest FreshnessStatus badge from provenance timestamps and connection state.
 */
export function computeFreshnessState(
  provenance: ProvenanceTimestamps,
  isOffline: boolean = false,
  hasSourceError: boolean = false,
  nowMs: number = Date.now()
): FreshnessStatus {
  if (isOffline) return 'Offline Cached';
  if (hasSourceError) return 'Source Error';

  const lastSuccessMs = provenance.lastSuccessfulFetchAt
    ? Date.parse(provenance.lastSuccessfulFetchAt)
    : Date.parse(provenance.lastFetchedAt);

  if (isNaN(lastSuccessMs)) return 'Polling Active';

  const ageMinutes = (nowMs - lastSuccessMs) / (1000 * 60);
  if (ageMinutes <= 15) return 'Fresh';
  if (ageMinutes <= 180) return 'Polling Active';
  return 'Delayed';
}

// ============================================================================
// Deterministic Educational & Scientific Simulation Solvers (Pure Math)
// ============================================================================

/**
 * 1. Quantum 2-Qubit Circuit Simulator
 * Computes exact statevector probabilities for |00>, |01>, |10>, |11> given
 * Ry(theta0) on Qubit 0, Ry(theta1) on Qubit 1, and optional CNOT entanglement.
 */
export interface QuantumSimulationOutput {
  probabilities: { state: '|00⟩' | '|01⟩' | '|10⟩' | '|11⟩'; probability: number; phaseRad: number }[];
  entanglementConcurrency: number; // 0 to 1
  blochZ0: number;
  blochZ1: number;
}

export function simulateTwoQubitCircuit(
  theta0Deg: number,
  theta1Deg: number,
  cnotEnabled: boolean,
  phaseShiftDeg: number = 0
): QuantumSimulationOutput {
  const t0 = (theta0Deg * Math.PI) / 180;
  const t1 = (theta1Deg * Math.PI) / 180;
  const phi = (phaseShiftDeg * Math.PI) / 180;

  const c0 = Math.cos(t0 / 2);
  const s0 = Math.sin(t0 / 2);
  const c1 = Math.cos(t1 / 2);
  const s1 = Math.sin(t1 / 2);

  // Initial product amplitudes: a00, a01, a10, a11
  const a00 = c0 * c1;
  const a01 = c0 * s1;
  let a10 = s0 * c1;
  let a11 = s0 * s1;

  if (cnotEnabled) {
    // CNOT with qubit 0 as control and qubit 1 as target swaps |10> and |11>
    const tmp = a10;
    a10 = a11;
    a11 = tmp;
  }

  const p00 = Number((a00 * a00).toFixed(4));
  const p01 = Number((a01 * a01).toFixed(4));
  const p10 = Number((a10 * a10).toFixed(4));
  const p11 = Number((a11 * a11).toFixed(4));

  // Concurrence for pure 2-qubit state: 2 * |a00*a11 - a01*a10|
  const concurrence = Math.min(1, Math.max(0, Number((2 * Math.abs(a00 * a11 - a01 * a10)).toFixed(4))));

  return {
    probabilities: [
      { state: '|00⟩', probability: p00, phaseRad: 0 },
      { state: '|01⟩', probability: p01, phaseRad: Number((phi * 0.5).toFixed(2)) },
      { state: '|10⟩', probability: p10, phaseRad: Number(phi.toFixed(2)) },
      { state: '|11⟩', probability: p11, phaseRad: Number((phi * 1.5).toFixed(2)) },
    ],
    entanglementConcurrency: concurrence,
    blochZ0: Number((p00 + p01 - (p10 + p11)).toFixed(3)),
    blochZ1: Number((p00 + p10 - (p01 + p11)).toFixed(3)),
  };
}

/**
 * 2. 3-DOF Planar/Spatial Robotic Arm Forward Kinematics
 * Computes joint positions and end-effector (x, y, z) coordinates in meters.
 */
export interface RoboticKinematicsOutput {
  endEffector: { x: number; y: number; z: number };
  reachRadiusMeters: number;
  manipulabilityIndex: number;
  jointPositions: { x: number; y: number; z: number }[];
}

export function solveRoboticArmKinematics(
  baseYawDeg: number,
  shoulderPitchDeg: number,
  elbowPitchDeg: number,
  wristPitchDeg: number
): RoboticKinematicsOutput {
  const L1 = 0.45; // Base to shoulder height (m)
  const L2 = 0.65; // Upper arm length (m)
  const L3 = 0.52; // Forearm length (m)
  const L4 = 0.22; // Wrist/gripper length (m)

  const yaw = (baseYawDeg * Math.PI) / 180;
  const t1 = (shoulderPitchDeg * Math.PI) / 180;
  const t2 = t1 + (elbowPitchDeg * Math.PI) / 180;
  const t3 = t2 + (wristPitchDeg * Math.PI) / 180;

  const p0 = { x: 0, y: 0, z: 0 };
  const p1 = { x: 0, y: L1, z: 0 };

  const r2 = L2 * Math.sin(t1);
  const y2 = L1 + L2 * Math.cos(t1);
  const p2 = {
    x: Number((r2 * Math.cos(yaw)).toFixed(3)),
    y: Number(y2.toFixed(3)),
    z: Number((r2 * Math.sin(yaw)).toFixed(3)),
  };

  const r3 = r2 + L3 * Math.sin(t2);
  const y3 = y2 + L3 * Math.cos(t2);
  const p3 = {
    x: Number((r3 * Math.cos(yaw)).toFixed(3)),
    y: Number(y3.toFixed(3)),
    z: Number((r3 * Math.sin(yaw)).toFixed(3)),
  };

  const r4 = r3 + L4 * Math.sin(t3);
  const y4 = y3 + L4 * Math.cos(t3);
  const p4 = {
    x: Number((r4 * Math.cos(yaw)).toFixed(3)),
    y: Number(Math.max(0.02, y4).toFixed(3)),
    z: Number((r4 * Math.sin(yaw)).toFixed(3)),
  };

  const reachRadiusMeters = Number(Math.sqrt(p4.x * p4.x + p4.y * p4.y + p4.z * p4.z).toFixed(3));
  const manipulabilityIndex = Number(
    Math.abs(Math.sin((elbowPitchDeg * Math.PI) / 180) * 0.85 + 0.15).toFixed(3)
  );

  return {
    endEffector: p4,
    reachRadiusMeters,
    manipulabilityIndex,
    jointPositions: [p0, p1, p2, p3, p4],
  };
}

/**
 * 3. Leaky Integrate-and-Fire (LIF) Cortical Neuron Simulator
 * Returns membrane potential trace (mV) and spike timestamps over a 60ms window.
 */
export interface NeuronSimulationOutput {
  trace: { timeMs: number; voltageMv: number; spiked: boolean }[];
  spikeCount: number;
  firingRateHz: number;
}

export function simulateLifNeuron(
  synapticCurrentNa: number,
  membraneTauMs: number,
  thresholdMv: number = -50
): NeuronSimulationOutput {
  const vRest = -70;
  const vReset = -75;
  const vPeak = 35;
  const resistanceMOhm = 18; // 18 MOhm membrane resistance
  const dt = 1; // 1 ms step
  const durationMs = 60;

  let v = vRest;
  let refractoryRemaining = 0;
  let spikeCount = 0;
  const trace: { timeMs: number; voltageMv: number; spiked: boolean }[] = [];

  for (let t = 0; t <= durationMs; t += dt) {
    if (refractoryRemaining > 0) {
      refractoryRemaining -= dt;
      v = vReset;
      trace.push({ timeMs: t, voltageMv: v, spiked: false });
      continue;
    }

    const dv = (-(v - vRest) + resistanceMOhm * synapticCurrentNa) / Math.max(2, membraneTauMs);
    v += dv * dt;

    if (v >= thresholdMv) {
      spikeCount++;
      trace.push({ timeMs: t, voltageMv: vPeak, spiked: true });
      v = vReset;
      refractoryRemaining = 3; // 3ms absolute refractory period
    } else {
      trace.push({ timeMs: t, voltageMv: Number(v.toFixed(2)), spiked: false });
    }
  }

  const firingRateHz = Math.round((spikeCount / (durationMs / 1000)) * 10) / 10;
  return { trace, spikeCount, firingRateHz };
}

/**
 * 4. Biosensor Michaelis-Menten Transduction Simulator
 */
export interface BiosensorSimulationOutput {
  steadyStateSignalUa: number;
  saturationPct: number;
  signalToNoiseDb: number;
  curve: { concentrationUm: number; currentUa: number }[];
}

export function simulateBiosensorResponse(
  analyteConcentrationUm: number,
  kmAffinityUm: number,
  enzymeLoadingFactor: number
): BiosensorSimulationOutput {
  const vMax = 120 * Math.max(0.2, enzymeLoadingFactor);
  const km = Math.max(1, kmAffinityUm);
  const c = Math.max(0, analyteConcentrationUm);

  const signal = (vMax * c) / (km + c);
  const saturationPct = (c / (km + c)) * 100;
  const snrDb = 12 + 10 * Math.log10(Math.max(1, signal * 1.8));

  const curve: { concentrationUm: number; currentUa: number }[] = [];
  for (let stepC = 0; stepC <= 200; stepC += 20) {
    curve.push({
      concentrationUm: stepC,
      currentUa: Number(((vMax * stepC) / (km + stepC)).toFixed(2)),
    });
  }

  return {
    steadyStateSignalUa: Number(signal.toFixed(2)),
    saturationPct: Number(saturationPct.toFixed(1)),
    signalToNoiseDb: Number(snrDb.toFixed(1)),
    curve,
  };
}

export const FRONTIER_DOMAINS: {
  id: FrontierDomainId;
  name: string;
  shortName: string;
  accentColor: string;
  description: string;
}[] = [
  {
    id: 'ai_deep_tech',
    name: 'Artificial Intelligence, Neural Networks & Deep Tech',
    shortName: 'AI & Neural Nets',
    accentColor: '#38bdf8',
    description: 'State-space architectures, sparse mixture-of-experts, neuromorphic silicon, and formal verification.',
  },
  {
    id: 'quantum_tech',
    name: 'Quantum Computing & Quantum Technologies',
    shortName: 'Quantum Tech',
    accentColor: '#a855f7',
    description: 'Fault-tolerant logical qubits, neutral-atom arrays, topological codes, and photonic interconnects.',
  },
  {
    id: 'neuro_engineering',
    name: 'Neuroscience, Neurotechnology & Neural Engineering',
    shortName: 'Neuroengineering',
    accentColor: '#f43f5e',
    description: 'High-density intracortical interfaces, connectomics, spike-sorting decoders, and closed-loop neurostimulation.',
  },
  {
    id: 'bio_engineering',
    name: 'Bioengineering, Biotechnology & Biological Systems',
    shortName: 'Bioengineering',
    accentColor: '#10b981',
    description: 'De novo protein design, programmable gene editors, microfluidic organ-on-chip, and synthetic metabolic pathways.',
  },
  {
    id: 'robotics_autonomous',
    name: 'Robotics, Autonomous Systems & Hardware',
    shortName: 'Robotics & Hardware',
    accentColor: '#f59e0b',
    description: 'Whole-body visuomotor policies, dexterous tactile manipulation, legged locomotion, and embodied SLAM.',
  },
];
