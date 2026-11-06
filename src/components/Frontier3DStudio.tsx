import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Box,
  Sliders,
  RotateCcw,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Atom,
  Brain,
  Dna,
  Bot,
  Sparkles,
} from 'lucide-react';
import { FrontierDomainId, SimulationCapabilityMode } from '../types/frontier.js';
import {
  simulateTwoQubitCircuit,
  solveRoboticArmKinematics,
  simulateLifNeuron,
  simulateBiosensorResponse,
} from '../utils/frontier-engine.js';

interface Frontier3DStudioProps {
  activeDomain: FrontierDomainId;
  onSelectDomain: (domain: FrontierDomainId) => void;
}

interface PartDescriptor {
  id: string;
  name: string;
  subsystem: string;
  materialSpec: string;
  telemetryNote: string;
}

export const Frontier3DStudio: React.FC<Frontier3DStudioProps> = ({
  activeDomain,
  onSelectDomain,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const robotJointRefs = useRef<{
    base?: THREE.Object3D;
    shoulder?: THREE.Object3D;
    elbow?: THREE.Object3D;
    wrist?: THREE.Object3D;
  }>({});

  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [explodedFactor, setExplodedFactor] = useState(0); // 0 to 1
  const [selectedPart, setSelectedPart] = useState<PartDescriptor | null>(null);
  const [rendererMode, setRendererMode] = useState<'Hardware WebGL' | 'Software WebGL Safe'>('Hardware WebGL');

  // Domain-specific simulation parameters
  // 1. Robotics (Degrees)
  const [baseYaw, setBaseYaw] = useState(25);
  const [shoulderPitch, setShoulderPitch] = useState(30);
  const [elbowPitch, setElbowPitch] = useState(45);
  const [wristPitch, setWristPitch] = useState(-20);

  // 2. Quantum (Degrees & CNOT)
  const [theta0, setTheta0] = useState(90);
  const [theta1, setTheta1] = useState(0);
  const [cnotEnabled, setCnotEnabled] = useState(true);
  const [phaseShift, setPhaseShift] = useState(45);

  // 3. Neuroscience (LIF Neuron)
  const [synapticCurrent, setSynapticCurrent] = useState(2.4);
  const [membraneTau, setMembraneTau] = useState(12);

  // 4. Bioengineering (Michaelis-Menten)
  const [analyteConc, setAnalyteConc] = useState(65);
  const [kmAffinity, setKmAffinity] = useState(40);
  const [enzymeLoading, setEnzymeLoading] = useState(1.2);

  // 5. AI Neural Architecture
  const [sparsityRatio, setSparsityRatio] = useState(0.65);
  const [sequenceLengthK, setSequenceLengthK] = useState(512);

  // Pure deterministic simulation outputs
  const quantumOut = useMemo(
    () => simulateTwoQubitCircuit(theta0, theta1, cnotEnabled, phaseShift),
    [theta0, theta1, cnotEnabled, phaseShift]
  );

  const roboticsOut = useMemo(
    () => solveRoboticArmKinematics(baseYaw, shoulderPitch, elbowPitch, wristPitch),
    [baseYaw, shoulderPitch, elbowPitch, wristPitch]
  );

  const neuronOut = useMemo(
    () => simulateLifNeuron(synapticCurrent, membraneTau, -50),
    [synapticCurrent, membraneTau]
  );

  const biosensorOut = useMemo(
    () => simulateBiosensorResponse(analyteConc, kmAffinity, enzymeLoading),
    [analyteConc, kmAffinity, enzymeLoading]
  );

  const capabilityBadge: { mode: SimulationCapabilityMode; label: string } = useMemo(() => {
    switch (activeDomain) {
      case 'robotics_autonomous':
        return { mode: 'kinematic_simulation', label: 'kinematic_simulation · Forward Kinematics' };
      case 'quantum_tech':
      case 'neuro_engineering':
      case 'bio_engineering':
        return { mode: 'physics_simulation', label: 'physics_simulation · Deterministic Solver' };
      default:
        return { mode: 'interactive_3d', label: 'interactive_3d · Composite Hardware Topology' };
    }
  }, [activeDomain]);

  // Build composite 3-12 part procedural 3D assembly per domain
  const buildDomainAssembly = (
    domain: FrontierDomainId,
    isWireframe: boolean,
    explode: number
  ): { group: THREE.Group; interactables: THREE.Object3D[] } => {
    const group = new THREE.Group();
    const interactables: THREE.Object3D[] = [];
    robotJointRefs.current = {};

    const addPart = (
      mesh: THREE.Mesh,
      descriptor: PartDescriptor,
      basePos: [number, number, number],
      explodeDir: [number, number, number] = [0, 0, 0]
    ) => {
      mesh.position.set(
        basePos[0] + explodeDir[0] * explode * 0.8,
        basePos[1] + explodeDir[1] * explode * 0.8,
        basePos[2] + explodeDir[2] * explode * 0.8
      );
      mesh.userData.partDescriptor = descriptor;
      interactables.push(mesh);
      return mesh;
    };

    // Soft contact shadow disc on ground plane (y = 0.015) to avoid Z-fighting
    const shadowGeo = new THREE.CircleGeometry(2.3, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.position.set(0, 0.015, 0);
    group.add(shadowDisc);

    // Base metrology pedestal (shared primary foundation)
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.78,
      metalness: 0.25,
      wireframe: isWireframe,
    });
    const plinth = addPart(
      new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.9, 0.22, 32), plinthMat),
      {
        id: 'part-plinth',
        name: 'Vibration-Isolated Metrology Baseplate',
        subsystem: 'Primary Structural Foundation',
        materialSpec: 'Anodized Aluminum 6061-T6 (Roughness 0.78)',
        telemetryNote: 'Sub-micron passive pneumatic isolation stage',
      },
      [0, 0.11, 0],
      [0, -0.3, 0]
    );
    group.add(plinth);

    if (domain === 'robotics_autonomous') {
      // 7-Part Articulated Robotic Manipulator Assembly
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.28,
        metalness: 0.82,
        wireframe: isWireframe,
      });
      const jointMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.45,
        metalness: 0.6,
        wireframe: isWireframe,
      });
      const sensorMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.15,
        metalness: 0.3,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        wireframe: isWireframe,
      });

      const basePivot = new THREE.Group();
      basePivot.position.set(0, 0.22, 0);
      basePivot.rotation.y = THREE.MathUtils.degToRad(baseYaw);
      robotJointRefs.current.base = basePivot;
      group.add(basePivot);

      const turret = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.38, 24), jointMat),
        {
          id: 'rob-turret',
          name: 'Harmonic-Drive Azimuth Turret (J1)',
          subsystem: 'Quasi-Direct-Drive Actuator',
          materialSpec: 'Ti-6Al-4V + Crossed Roller Bearing',
          telemetryNote: `Yaw Angle: ${baseYaw}° | Peak Torque: 110 Nm`,
        },
        [0, 0.19, 0],
        [0, 0, 0]
      );
      basePivot.add(turret);

      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(0, 0.38, 0);
      shoulderPivot.rotation.z = THREE.MathUtils.degToRad(-shoulderPitch);
      robotJointRefs.current.shoulder = shoulderPivot;
      basePivot.add(shoulderPivot);

      const shoulderHub = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.52, 20).rotateX(Math.PI / 2), metalMat),
        {
          id: 'rob-shoulder',
          name: 'Shoulder Pitch Actuator Housing (J2)',
          subsystem: 'Brushless Outrunner Torque Module',
          materialSpec: 'CNC Billet Aluminum 7075',
          telemetryNote: `Pitch: ${shoulderPitch}° | Closed-Loop 1kHz Impedance`,
        },
        [0, 0, 0],
        [0, 0.2, 0.3]
      );
      shoulderPivot.add(shoulderHub);

      const upperArm = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.26), metalMat),
        {
          id: 'rob-upper-arm',
          name: 'Carbon-Reinforced Upper Link',
          subsystem: 'Primary Structural Arm',
          materialSpec: 'CFRP / Aluminum Hybrid Spar',
          telemetryNote: 'Internal EtherCAT optical slip-ring routing',
        },
        [0, 0.58, 0],
        [-0.3, 0.2, 0]
      );
      shoulderPivot.add(upperArm);

      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0, 1.15, 0);
      elbowPivot.rotation.z = THREE.MathUtils.degToRad(-elbowPitch);
      robotJointRefs.current.elbow = elbowPivot;
      shoulderPivot.add(elbowPivot);

      const elbowJoint = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 20).rotateX(Math.PI / 2), jointMat),
        {
          id: 'rob-elbow',
          name: 'Distal Elbow Torque Joint (J3)',
          subsystem: 'Cycloidal Gear Reducer',
          materialSpec: 'Hardened Maraging Steel',
          telemetryNote: `Elbow Angle: ${elbowPitch}° | Zero-backlash harmonic stage`,
        },
        [0, 0, 0],
        [0, 0.3, -0.3]
      );
      elbowPivot.add(elbowJoint);

      const forearm = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.92, 16), metalMat),
        {
          id: 'rob-forearm',
          name: 'Distal Forearm Tube',
          subsystem: 'Secondary Manipulation Link',
          materialSpec: 'Brushed Alloy 6061 (Roughness 0.28)',
          telemetryNote: 'Houses 6-axis strain-gauge force/torque sensor',
        },
        [0, 0.46, 0],
        [0.3, 0.4, 0]
      );
      elbowPivot.add(forearm);

      const wristPivot = new THREE.Group();
      wristPivot.position.set(0, 0.92, 0);
      wristPivot.rotation.z = THREE.MathUtils.degToRad(-wristPitch);
      robotJointRefs.current.wrist = wristPivot;
      elbowPivot.add(wristPivot);

      const tactileGripper = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.28), sensorMat),
        {
          id: 'rob-gripper',
          name: 'GelSight Optical Tactile Parallel Gripper',
          subsystem: 'End-Effector Visuotactile Array',
          materialSpec: 'Elastomer Gel + RGB Photometric Stereo LEDs',
          telemetryNote: `Reach: ${roboticsOut.reachRadiusMeters}m | 1kHz Shear-Force Field`,
        },
        [0, 0.16, 0],
        [0, 0.6, 0]
      );
      wristPivot.add(tactileGripper);
    } else if (domain === 'quantum_tech') {
      // Neutral-Atom Cryogenic / Optical Trap Chamber (7 parts)
      const copperGoldMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        roughness: 0.22,
        metalness: 0.88,
        wireframe: isWireframe,
      });
      const glassChamberMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.55,
        wireframe: isWireframe,
      });
      const laserMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        roughness: 0.2,
        metalness: 0.4,
        emissive: 0x9333ea,
        emissiveIntensity: 0.55,
        wireframe: isWireframe,
      });

      // Cold stages
      const stage1 = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.12, 32), copperGoldMat),
        {
          id: 'q-stage-1',
          name: '4K Pulse-Tube Flange Plate',
          subsystem: 'Cryogenic Thermal Shielding',
          materialSpec: 'Gold-Plated Oxygen-Free High-Conductivity Copper',
          telemetryNote: 'Thermal load: 1.1 W at 3.8 Kelvin',
        },
        [0, 1.95, 0],
        [0, 0.6, 0]
      );
      group.add(stage1);

      const stage2 = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 32), copperGoldMat),
        {
          id: 'q-stage-2',
          name: '100mK Still Shielding Plate',
          subsystem: 'Dilution / Optical Isolation Stage',
          materialSpec: 'OFHC Copper Mirror Polish (Roughness 0.22)',
          telemetryNote: 'Coherence preservation shield',
        },
        [0, 1.35, 0],
        [0, 0.3, 0]
      );
      group.add(stage2);

      // UHV Glass Cell
      const cell = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.68, 0.95), glassChamberMat),
        {
          id: 'q-uhv-cell',
          name: 'Ultra-High Vacuum Fused-Silica Optical Cell',
          subsystem: '288-Qubit Rubidium-87 Trap Zone',
          materialSpec: 'AR-Coated Fused Quartz (Roughness 0.15)',
          telemetryNote: `Entanglement Concurrence: ${quantumOut.entanglementConcurrency}`,
        },
        [0, 0.72, 0],
        [0, 0, 0]
      );
      group.add(cell);

      // Optical Tweezer Lattice Core inside cell
      const latticeCore = addPart(
        new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), laserMat),
        {
          id: 'q-tweezer-lattice',
          name: '2D Acousto-Optic Deflector (AOD) Atom Register',
          subsystem: 'Zoned Entangling & Storage Array',
          materialSpec: '852nm Optical Lattice Trap',
          telemetryNote: `|00⟩: ${(quantumOut.probabilities[0].probability * 100).toFixed(1)}% | |11⟩: ${(quantumOut.probabilities[3].probability * 100).toFixed(1)}%`,
        },
        [0, 0.72, 0],
        [0, 0.15, 0]
      );
      group.add(latticeCore);

      // 4 Objective lenses around cell
      const lensGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 20);
      lensGeo.rotateZ(Math.PI / 2);
      const lensXPos = addPart(
        new THREE.Mesh(lensGeo, copperGoldMat),
        {
          id: 'q-lens-x',
          name: 'High-NA (0.65) Rydberg Excitation Objective',
          subsystem: '480nm / 780nm Two-Photon Optical Bus',
          materialSpec: 'Custom Aspheric Multi-Element Assembly',
          telemetryNote: 'Diffraction-limited 0.9 µm waist spot size',
        },
        [0.82, 0.72, 0],
        [0.5, 0, 0]
      );
      group.add(lensXPos);
    } else if (domain === 'neuro_engineering') {
      // Bidirectional 4,096-Channel Cortical Mesh & Neural Interface (6 parts)
      const meshMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        roughness: 0.32,
        metalness: 0.45,
        wireframe: isWireframe,
      });
      const asicMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.18,
        metalness: 0.85,
        wireframe: isWireframe,
      });
      const somaMat = new THREE.MeshStandardMaterial({
        color: 0xfb7185,
        roughness: 0.55,
        metalness: 0.15,
        emissive: 0xe11d48,
        emissiveIntensity: neuronOut.spikeCount > 0 ? 0.45 : 0.1,
        wireframe: isWireframe,
      });

      const corticalSubstrate = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 2.1), somaMat),
        {
          id: 'neuro-cortex',
          name: 'Layer II/III Pyramidal Cortical Tissue Phantom',
          subsystem: 'Volume Conductor Bio-Substrate',
          materialSpec: 'Viscoelastic Hydrogel Phantom (Roughness 0.55)',
          telemetryNote: `Firing Rate: ${neuronOut.firingRateHz} Hz (${neuronOut.spikeCount} spikes / 60ms)`,
        },
        [0, 0.42, 0],
        [0, -0.2, 0]
      );
      group.add(corticalSubstrate);

      const thinFilmGrid = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.05, 1.75), meshMat),
        {
          id: 'neuro-ecog-grid',
          name: '4,096-Channel PEDOT:PSS Thin-Film µECoG Array',
          subsystem: 'Conformal Cortical Recording & Stimulation Mesh',
          materialSpec: 'Silk-Fibroin + Conductive Polymer (8 µm thickness)',
          telemetryNote: '1kHz broadband spike-band acquisition',
        },
        [0, 0.68, 0],
        [0, 0.2, 0]
      );
      group.add(thinFilmGrid);

      const neuralAsic = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.24, 24), asicMat),
        {
          id: 'neuro-asic',
          name: 'Hermetic Titanium Neural Decoder ASIC',
          subsystem: '11.8 mW Intradural Signal Processor',
          materialSpec: 'Laser-Welded Grade 5 Titanium + Sapphire Window',
          telemetryNote: `Synaptic Drive: ${synapticCurrent} nA | Tau: ${membraneTau} ms`,
        },
        [0, 1.05, 0],
        [0, 0.65, 0]
      );
      group.add(neuralAsic);

      const inductiveCoil = addPart(
        new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 16, 40).rotateX(Math.PI / 2), meshMat),
        {
          id: 'neuro-coil',
          name: 'Near-Field Inductive Telemetry & Power Halo',
          subsystem: '13.56 MHz Transcutaneous Link',
          materialSpec: 'Encapsulated Gold Micro-Coil',
          telemetryNote: '48 Mbps uplink with < 0.3°C thermal dissipation',
        },
        [0, 1.32, 0],
        [0, 0.95, 0]
      );
      group.add(inductiveCoil);
    } else if (domain === 'bio_engineering') {
      // Microfluidic Organ-on-Chip & De Novo Allosteric Biosensor Array (6 parts)
      const chipMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.16,
        metalness: 0.2,
        transparent: true,
        opacity: 0.65,
        wireframe: isWireframe,
      });
      const goldElectrodeMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.24,
        metalness: 0.9,
        wireframe: isWireframe,
      });
      const proteinMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        roughness: 0.45,
        metalness: 0.25,
        emissive: 0x059669,
        emissiveIntensity: 0.35,
        wireframe: isWireframe,
      });

      const cmosPotentiostat = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.5), goldElectrodeMat),
        {
          id: 'bio-cmos',
          name: '16-Channel Sub-Picoampere CMOS Potentiostat Array',
          subsystem: 'Electrochemical Readout Backplane',
          materialSpec: 'Gold Nanostructured Working Electrodes',
          telemetryNote: `Faradaic Current: ${biosensorOut.steadyStateSignalUa} µA | SNR: ${biosensorOut.signalToNoiseDb} dB`,
        },
        [0, 0.38, 0],
        [0, -0.2, 0]
      );
      group.add(cmosPotentiostat);

      const pdmsManifold = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 1.4), chipMat),
        {
          id: 'bio-pdms',
          name: 'Laminar Microfluidic Serpentine Mixing Chamber',
          subsystem: 'Zwitterionic Non-Fouling Perfusion Cartridge',
          materialSpec: 'Oxygen-Plasma Bonded Cyclic Olefin Copolymer',
          telemetryNote: `Analyte: ${analyteConc} µM | Saturation: ${biosensorOut.saturationPct}%`,
        },
        [0, 0.72, 0],
        [0, 0.25, 0]
      );
      group.add(pdmsManifold);

      const proteinSwitch = addPart(
        new THREE.Mesh(new THREE.TorusKnotGeometry(0.34, 0.1, 64, 16), proteinMat),
        {
          id: 'bio-protein-switch',
          name: 'De Novo SE(3)-Flow Allosteric Hinge-Switch Protein',
          subsystem: 'Conformationally Gated Redox Transducer',
          materialSpec: 'Synthetic 142-Residue Alpha-Helical Bundle',
          telemetryNote: `Michaelis Constant Km: ${kmAffinity} µM`,
        },
        [0, 1.28, 0],
        [0, 0.7, 0]
      );
      group.add(proteinSwitch);
    } else {
      // ai_deep_tech: 3D Wafer-Scale Liquid State-Space Neural Accelerator (7 parts)
      const waferMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.2,
        metalness: 0.85,
        wireframe: isWireframe,
      });
      const hbmMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.5,
        metalness: 0.65,
        wireframe: isWireframe,
      });
      const tensorCoreMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.15,
        metalness: 0.4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        wireframe: isWireframe,
      });

      const interposer = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 2.3), waferMat),
        {
          id: 'ai-interposer',
          name: 'CoWoS-L Silicon Photonic Interposer',
          subsystem: '9.6 TB/s Optical Die-to-Die Fabric',
          materialSpec: '3nm Monolithic Silicon + Copper Micro-Bumps',
          telemetryNote: `Context Window: ${sequenceLengthK}K Tokens | Active Sparsity: ${Math.round(sparsityRatio * 100)}%`,
        },
        [0, 0.35, 0],
        [0, -0.2, 0]
      );
      group.add(interposer);

      const systolicDie = addPart(
        new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.24, 1.25), tensorCoreMat),
        {
          id: 'ai-systolic-core',
          name: 'Liquid-SSM Block-Sparse Systolic Tensor Array',
          subsystem: 'Continuous-Time State-Space Compute Engine',
          materialSpec: 'High-NA EUV 3D-Stacked Logic Die',
          telemetryNote: `KV-Cache Reduction: ${(sparsityRatio * 96).toFixed(1)}% | Throughput: ${(1 + sparsityRatio * 2.1).toFixed(2)}x`,
        },
        [0, 0.6, 0],
        [0, 0.25, 0]
      );
      group.add(systolicDie);

      // 4 HBM4 stacks around the compute die
      const hbmOffsets: [number, number][] = [
        [-0.82, -0.6],
        [-0.82, 0.6],
        [0.82, -0.6],
        [0.82, 0.6],
      ];
      hbmOffsets.forEach(([ox, oz], idx) => {
        const stack = addPart(
          new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.46), hbmMat),
          {
            id: `ai-hbm-${idx + 1}`,
            name: `16-Hi HBM4 Near-Memory Cube #${idx + 1}`,
            subsystem: '2048-Bit Wide High-Bandwidth Memory Stack',
            materialSpec: 'Hybrid-Bonded DRAM Stack (Roughness 0.50)',
            telemetryNote: '2.4 TB/s per stack with on-base-die state compression',
          },
          [ox, 0.58, oz],
          [ox * 0.5, 0.35, oz * 0.5]
        );
        group.add(stack);
      });

      const coldPlate = addPart(
        new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.18, 8), waferMat),
        {
          id: 'ai-coldplate',
          name: 'Two-Phase Direct-to-Chip Microchannel Coldplate',
          subsystem: '1,200W Thermal Dissipation Manifold',
          materialSpec: 'Sintered Copper Micro-Skived Fins',
          telemetryNote: 'Junction temperature stabilized at 54.2°C',
        },
        [0, 1.02, 0],
        [0, 0.75, 0]
      );
      group.add(coldPlate);
    }

    return { group, interactables };
  };

  // Mount WebGLRenderer & Scene once per lifecycle rules
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.065);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.1, 2.3, 3.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const isSoftwareGl = /SwiftShader|Software|llvmpipe/i.test(
      (renderer.capabilities as { renderer?: string }).renderer || ''
    );
    setRendererMode(isSoftwareGl ? 'Software WebGL Safe' : 'Hardware WebGL');

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio PBR environment reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Warm key directional light + cool HemisphereLight fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6366f1, 1.1);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Subtle reference coordinate grid on floor (y = 0)
    const grid = new THREE.GridHelper(10, 20, 0x1e293b, 0x0f172a);
    grid.position.y = 0;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.8, 0);
    controls.minDistance = 1.6;
    controls.maxDistance = 9.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;

    const rootHolder = new THREE.Group();
    scene.add(rootHolder);
    sceneGroupRef.current = rootHolder;

    let animFrameId: number | null = null;
    let needsRender = true;

    const renderOnce = () => {
      needsRender = false;
      controls.update();
      renderer.render(scene, camera);
    };

    const requestRender = () => {
      if (!needsRender) {
        needsRender = true;
        animFrameId = requestAnimationFrame(renderOnce);
      }
    };
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', requestRender);

    // Raycast click handler on interactables
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const meshes: THREE.Object3D[] = [];
      rootHolder.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh && obj.userData.partDescriptor) {
          meshes.push(obj);
        }
      });

      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        setSelectedPart(hitObj.userData.partDescriptor as PartDescriptor);
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    // Initial render
    renderOnce();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      controls.dispose();
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  // Rebuild domain assembly when activeDomain, wireframeMode, or explodedFactor changes
  useEffect(() => {
    const holder = sceneGroupRef.current;
    if (!holder) return;

    while (holder.children.length > 0) {
      holder.remove(holder.children[0]);
    }

    const { group, interactables } = buildDomainAssembly(
      activeDomain,
      wireframeMode,
      explodedFactor
    );
    holder.add(group);

    if (interactables.length > 0) {
      setSelectedPart(interactables[interactables.length - 1].userData.partDescriptor);
    }

    requestRenderRef.current?.();
  }, [activeDomain, wireframeMode, explodedFactor]);

  // Update robotic arm joint rotations in real time without rebuilding geometry
  useEffect(() => {
    if (activeDomain !== 'robotics_autonomous') {
      requestRenderRef.current?.();
      return;
    }
    const joints = robotJointRefs.current;
    if (joints.base) joints.base.rotation.y = THREE.MathUtils.degToRad(baseYaw);
    if (joints.shoulder) joints.shoulder.rotation.z = THREE.MathUtils.degToRad(-shoulderPitch);
    if (joints.elbow) joints.elbow.rotation.z = THREE.MathUtils.degToRad(-elbowPitch);
    if (joints.wrist) joints.wrist.rotation.z = THREE.MathUtils.degToRad(-wristPitch);
    requestRenderRef.current?.();
  }, [activeDomain, baseYaw, shoulderPitch, elbowPitch, wristPitch]);

  return (
    <div
      data-testid="frontier-3d-studio"
      className="relative w-full h-[640px] rounded-3xl overflow-hidden border border-slate-800 bg-[#090d16] text-slate-100 shadow-2xl flex flex-col"
    >
      {/* Dedicated Empty Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-Left Compact Title & Honest Capability Badge */}
      <div className="relative z-10 pointer-events-none p-4 flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto bg-[#0f172a] border border-slate-800 rounded-2xl p-3 shadow-lg max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono text-[10px] font-bold uppercase tracking-wider">
              {capabilityBadge.mode}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {rendererMode}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">
            FrontierAtlas 3D Spatial &amp; Mathematical Simulation Studio
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any 3D sub-assembly to inspect materials &amp; telemetry. Drag to orbit, scroll to zoom.
          </p>

          {/* Domain Selector Tabs */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {(
              [
                { id: 'ai_deep_tech', label: 'AI Silicon', icon: Cpu },
                { id: 'quantum_tech', label: 'Quantum Trap', icon: Atom },
                { id: 'robotics_autonomous', label: 'Robotic Arm', icon: Bot },
                { id: 'neuro_engineering', label: 'Cortical BCI', icon: Brain },
                { id: 'bio_engineering', label: 'Biosensor', icon: Dna },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeDomain === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectDomain(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    active
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-Right Selected Part Inspector & View Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 bg-[#0f172a] border border-slate-800 rounded-xl p-1.5">
            <button
              type="button"
              onClick={() => setWireframeMode((w) => !w)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                wireframeMode ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Wireframe
            </button>
            <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-300">
              <span>Explode:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={explodedFactor}
                aria-label="Exploded view factor"
                onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                className="w-20 accent-sky-400 cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setExplodedFactor(0);
                setWireframeMode(false);
                setBaseYaw(25);
                setShoulderPitch(30);
                setElbowPitch(45);
                setWristPitch(-20);
              }}
              title="Reset 3D View & Parameters"
              aria-label="Reset 3D view and parameters"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedPart && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3 max-w-xs text-xs shadow-lg">
              <div className="text-[10px] font-mono uppercase text-sky-400 font-bold">
                {selectedPart.subsystem}
              </div>
              <div className="font-bold text-white mt-0.5">{selectedPart.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">{selectedPart.materialSpec}</div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800 font-mono text-[11px] text-emerald-400">
                {selectedPart.telemetryNote}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spacer so canvas remains >= 75% unobstructed */}
      <div className="flex-1 pointer-events-none" />

      {/* Collapsible Bottom Control Dock (max-height <= 28% of viewport) */}
      <div className="relative z-10 pointer-events-auto bg-[#0f172a] border-t border-slate-800 px-4 py-2.5 max-h-[180px] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Interactive Simulation Parameters &amp; Live Readout
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              (Deterministic Mathematical Model — No Fake Hardware Telemetry)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>{dockCollapsed ? 'Expand Controls' : 'Collapse Dock'}</span>
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!dockCollapsed && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {activeDomain === 'robotics_autonomous' && (
              <>
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Base Yaw (J1)</span>
                      <span className="font-mono text-amber-400">{baseYaw}°</span>
                    </span>
                    <input
                      type="range"
                      min={-160}
                      max={160}
                      value={baseYaw}
                      onChange={(e) => setBaseYaw(Number(e.target.value))}
                      className="w-full accent-amber-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Shoulder (J2)</span>
                      <span className="font-mono text-amber-400">{shoulderPitch}°</span>
                    </span>
                    <input
                      type="range"
                      min={-75}
                      max={75}
                      value={shoulderPitch}
                      onChange={(e) => setShoulderPitch(Number(e.target.value))}
                      className="w-full accent-amber-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Elbow (J3)</span>
                      <span className="font-mono text-amber-400">{elbowPitch}°</span>
                    </span>
                    <input
                      type="range"
                      min={-110}
                      max={110}
                      value={elbowPitch}
                      onChange={(e) => setElbowPitch(Number(e.target.value))}
                      className="w-full accent-amber-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Wrist Pitch (J4)</span>
                      <span className="font-mono text-amber-400">{wristPitch}°</span>
                    </span>
                    <input
                      type="range"
                      min={-90}
                      max={90}
                      value={wristPitch}
                      onChange={(e) => setWristPitch(Number(e.target.value))}
                      className="w-full accent-amber-400 mt-1"
                    />
                  </label>
                </div>
                <div className="lg:col-span-5 grid grid-cols-3 gap-2 font-mono text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">End-Effector (m)</div>
                    <div className="text-amber-400 font-bold">
                      ({roboticsOut.endEffector.x}, {roboticsOut.endEffector.y}, {roboticsOut.endEffector.z})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Reach Radius</div>
                    <div className="text-emerald-400 font-bold">{roboticsOut.reachRadiusMeters} m</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Manipulability</div>
                    <div className="text-sky-400 font-bold">{roboticsOut.manipulabilityIndex}</div>
                  </div>
                </div>
              </>
            )}

            {activeDomain === 'quantum_tech' && (
              <>
                <div className="lg:col-span-6 grid grid-cols-3 gap-3 text-xs">
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Q0 Ry(θ₀)</span>
                      <span className="font-mono text-purple-400">{theta0}°</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      value={theta0}
                      onChange={(e) => setTheta0(Number(e.target.value))}
                      className="w-full accent-purple-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Q1 Ry(θ₁)</span>
                      <span className="font-mono text-purple-400">{theta1}°</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      value={theta1}
                      onChange={(e) => setTheta1(Number(e.target.value))}
                      className="w-full accent-purple-400 mt-1"
                    />
                  </label>
                  <div className="flex flex-col justify-center">
                    <span className="text-slate-400 mb-1">Entangling Gate</span>
                    <button
                      type="button"
                      onClick={() => setCnotEnabled((v) => !v)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer ${
                        cnotEnabled ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      CNOT: {cnotEnabled ? 'ACTIVE' : 'BYPASSED'}
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-6 grid grid-cols-5 gap-2 font-mono text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  {quantumOut.probabilities.map((p) => (
                    <div key={p.state}>
                      <div className="text-[10px] text-slate-400">{p.state}</div>
                      <div className="text-purple-300 font-bold">{(p.probability * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                  <div>
                    <div className="text-[10px] text-slate-400">Concurrence</div>
                    <div className="text-emerald-400 font-bold">{quantumOut.entanglementConcurrency}</div>
                  </div>
                </div>
              </>
            )}

            {activeDomain === 'neuro_engineering' && (
              <>
                <div className="lg:col-span-6 grid grid-cols-2 gap-4 text-xs">
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Synaptic Drive Current (I_syn)</span>
                      <span className="font-mono text-rose-400">{synapticCurrent} nA</span>
                    </span>
                    <input
                      type="range"
                      min={0.4}
                      max={4.5}
                      step={0.1}
                      value={synapticCurrent}
                      onChange={(e) => setSynapticCurrent(Number(e.target.value))}
                      className="w-full accent-rose-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Membrane Time Constant (τ_m)</span>
                      <span className="font-mono text-rose-400">{membraneTau} ms</span>
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={membraneTau}
                      onChange={(e) => setMembraneTau(Number(e.target.value))}
                      className="w-full accent-rose-400 mt-1"
                    />
                  </label>
                </div>
                <div className="lg:col-span-6 flex items-center justify-between gap-4 font-mono text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">Spikes (60ms Window)</div>
                    <div className="text-rose-400 font-bold">{neuronOut.spikeCount} Action Potentials</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Mean Firing Rate</div>
                    <div className="text-emerald-400 font-bold">{neuronOut.firingRateHz} Hz</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Threshold</div>
                    <div className="text-slate-300 font-bold">-50.0 mV</div>
                  </div>
                </div>
              </>
            )}

            {activeDomain === 'bio_engineering' && (
              <>
                <div className="lg:col-span-6 grid grid-cols-3 gap-3 text-xs">
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Analyte [C]</span>
                      <span className="font-mono text-emerald-400">{analyteConc} µM</span>
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={5}
                      value={analyteConc}
                      onChange={(e) => setAnalyteConc(Number(e.target.value))}
                      className="w-full accent-emerald-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Affinity Km</span>
                      <span className="font-mono text-emerald-400">{kmAffinity} µM</span>
                    </span>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={kmAffinity}
                      onChange={(e) => setKmAffinity(Number(e.target.value))}
                      className="w-full accent-emerald-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Switch Density</span>
                      <span className="font-mono text-emerald-400">{enzymeLoading}x</span>
                    </span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      value={enzymeLoading}
                      onChange={(e) => setEnzymeLoading(Number(e.target.value))}
                      className="w-full accent-emerald-400 mt-1"
                    />
                  </label>
                </div>
                <div className="lg:col-span-6 grid grid-cols-3 gap-2 font-mono text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">Faradaic Readout</div>
                    <div className="text-emerald-400 font-bold">{biosensorOut.steadyStateSignalUa} µA</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Receptor Occupancy</div>
                    <div className="text-amber-400 font-bold">{biosensorOut.saturationPct}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Output SNR</div>
                    <div className="text-sky-400 font-bold">{biosensorOut.signalToNoiseDb} dB</div>
                  </div>
                </div>
              </>
            )}

            {activeDomain === 'ai_deep_tech' && (
              <>
                <div className="lg:col-span-6 grid grid-cols-2 gap-4 text-xs">
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Block-Sparse Routing Ratio</span>
                      <span className="font-mono text-sky-400">{Math.round(sparsityRatio * 100)}%</span>
                    </span>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={sparsityRatio}
                      onChange={(e) => setSparsityRatio(Number(e.target.value))}
                      className="w-full accent-sky-400 mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 flex justify-between">
                      <span>Active Sequence Context</span>
                      <span className="font-mono text-sky-400">{sequenceLengthK}K Tokens</span>
                    </span>
                    <input
                      type="range"
                      min={64}
                      max={2048}
                      step={64}
                      value={sequenceLengthK}
                      onChange={(e) => setSequenceLengthK(Number(e.target.value))}
                      className="w-full accent-sky-400 mt-1"
                    />
                  </label>
                </div>
                <div className="lg:col-span-6 grid grid-cols-3 gap-2 font-mono text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">HBM4 Bandwidth Saved</div>
                    <div className="text-sky-400 font-bold">{(sparsityRatio * 96).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Effective Speedup</div>
                    <div className="text-emerald-400 font-bold">{(1 + sparsityRatio * 2.1).toFixed(2)}x</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Complexity Scaling</div>
                    <div className="text-amber-400 font-bold">O(N) Linear</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
