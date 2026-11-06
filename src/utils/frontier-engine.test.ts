import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSafeExternalUrl,
  normalizeDoi,
  normalizeArxivId,
  computeCanonicalKey,
  simulateTwoQubitCircuit,
  solveRoboticArmKinematics,
  simulateLifNeuron,
  simulateBiosensorResponse,
} from './frontier-engine.js';

test('isSafeExternalUrl blocks SSRF internal/loopback targets and allows public HTTPS endpoints', () => {
  assert.equal(isSafeExternalUrl('https://export.arxiv.org/api/query'), true);
  assert.equal(isSafeExternalUrl('https://api.openalex.org/works'), true);
  assert.equal(isSafeExternalUrl('http://127.0.0.1:8080/admin'), false);
  assert.equal(isSafeExternalUrl('http://localhost:3000/api'), false);
  assert.equal(isSafeExternalUrl('http://169.254.169.254/latest/meta-data/'), false);
  assert.equal(isSafeExternalUrl('http://192.168.1.10/config'), false);
  assert.equal(isSafeExternalUrl('file:///etc/passwd'), false);
});

test('normalizeDoi and normalizeArxivId canonicalize identifiers accurately', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1038/s41586-026-01234-x'), '10.1038/s41586-026-01234-x');
  assert.equal(normalizeArxivId('https://arxiv.org/abs/2502.14821v3'), '2502.14821');
  assert.equal(
    computeCanonicalKey({
      doi: '10.1126/science.abc1234',
      arxivId: '2502.14821v1',
      title: 'Test Paper',
    }),
    'doi:10.1126/science.abc1234'
  );
});

test('simulateTwoQubitCircuit preserves unit probability sum and Bell state entanglement', () => {
  // Bell state |Phi+> when theta0 = 90 deg, theta1 = 0 deg, CNOT = true
  const bell = simulateTwoQubitCircuit(90, 0, true, 0);
  const sum = bell.probabilities.reduce((acc, p) => acc + p.probability, 0);
  assert.ok(Math.abs(sum - 1) < 0.001);
  assert.ok(bell.entanglementConcurrency > 0.99);
});

test('solveRoboticArmKinematics computes bounded reach and 5 joint coordinates', () => {
  const fk = solveRoboticArmKinematics(45, 30, 45, 15);
  assert.equal(fk.jointPositions.length, 5);
  assert.ok(fk.reachRadiusMeters > 0 && fk.reachRadiusMeters < 2.5);
});

test('simulateLifNeuron fires action potentials under suprathreshold synaptic current', () => {
  const sub = simulateLifNeuron(0.5, 15, -50);
  assert.equal(sub.spikeCount, 0);

  const supra = simulateLifNeuron(2.5, 10, -50);
  assert.ok(supra.spikeCount > 0);
  assert.ok(supra.firingRateHz > 0);
});

test('simulateBiosensorResponse follows Michaelis-Menten half-saturation at C == Km', () => {
  const res = simulateBiosensorResponse(50, 50, 1.0);
  assert.equal(res.saturationPct, 50);
});
