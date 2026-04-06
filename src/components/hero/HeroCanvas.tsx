'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

export type LandscapeType = 'default' | 'mountain' | 'beach' | 'city' | 'temple';

interface HeroCanvasProps {
  landscapeType?: LandscapeType;
}

// Noise helpers for procedural terrain
const NOISE_PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin2D(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = NOISE_PERM[NOISE_PERM[xi] + yi];
  const ab = NOISE_PERM[NOISE_PERM[xi] + yi + 1];
  const ba = NOISE_PERM[NOISE_PERM[xi + 1] + yi];
  const bb = NOISE_PERM[NOISE_PERM[xi + 1] + yi + 1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * perlin2D(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

// Landscape terrain generation parameters
interface TerrainParams {
  heightScale: number;
  frequency: number;
  octaves: number;
  ridgeAmount: number;
  flattenPower: number;
  plateauThreshold: number;
}

const TERRAIN_PARAMS: Record<LandscapeType, TerrainParams> = {
  default: {
    heightScale: 1.8,
    frequency: 0.8,
    octaves: 5,
    ridgeAmount: 0.3,
    flattenPower: 1.0,
    plateauThreshold: 0.0,
  },
  mountain: {
    heightScale: 3.5,
    frequency: 0.6,
    octaves: 6,
    ridgeAmount: 0.7,
    flattenPower: 0.8,
    plateauThreshold: 0.0,
  },
  beach: {
    heightScale: 0.6,
    frequency: 1.2,
    octaves: 3,
    ridgeAmount: 0.0,
    flattenPower: 2.0,
    plateauThreshold: 0.0,
  },
  city: {
    heightScale: 2.2,
    frequency: 2.5,
    octaves: 2,
    ridgeAmount: 0.0,
    flattenPower: 0.3,
    plateauThreshold: 0.6,
  },
  temple: {
    heightScale: 2.0,
    frequency: 0.5,
    octaves: 4,
    ridgeAmount: 0.5,
    flattenPower: 1.2,
    plateauThreshold: 0.3,
  },
};

// Color palettes for each landscape
interface ColorPalette {
  low: [number, number, number];
  mid: [number, number, number];
  high: [number, number, number];
}

const COLOR_PALETTES: Record<LandscapeType, ColorPalette> = {
  default: {
    low: [0.992, 0.965, 0.925],   // cream
    mid: [0.769, 0.322, 0.165],   // terracotta
    high: [0.420, 0.561, 0.443],  // sage
  },
  mountain: {
    low: [0.420, 0.561, 0.443],   // sage
    mid: [0.608, 0.714, 0.624],   // light sage
    high: [0.992, 0.965, 0.925],  // cream (snow)
  },
  beach: {
    low: [0.380, 0.580, 0.720],   // ocean blue
    mid: [0.992, 0.965, 0.925],   // cream (sand)
    high: [0.769, 0.322, 0.165],  // terracotta
  },
  city: {
    low: [0.176, 0.176, 0.176],   // charcoal
    mid: [0.769, 0.322, 0.165],   // terracotta
    high: [0.992, 0.965, 0.925],  // cream (lights)
  },
  temple: {
    low: [0.420, 0.561, 0.443],   // sage
    mid: [0.769, 0.322, 0.165],   // terracotta
    high: [0.831, 0.451, 0.290],  // light terracotta
  },
};

const vertexShader = `
  uniform float uTime;
  uniform float uHeightScale;
  uniform float uFrequency;
  uniform float uOctaves;
  uniform float uRidgeAmount;
  uniform float uFlattenPower;
  uniform float uPlateauThreshold;
  uniform float uMorphProgress;
  uniform float uTargetHeightScale;
  uniform float uTargetFrequency;
  uniform float uTargetOctaves;
  uniform float uTargetRidgeAmount;
  uniform float uTargetFlattenPower;
  uniform float uTargetPlateauThreshold;

  varying float vHeight;
  varying vec2 vUv;
  varying vec3 vNormal;

  // Simplex-style noise via GLSL
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbmNoise(vec2 p, float freq, float octs) {
    float value = 0.0;
    float amp = 0.5;
    float f = freq;
    for (int i = 0; i < 8; i++) {
      if (float(i) >= octs) break;
      value += amp * snoise(p * f);
      amp *= 0.5;
      f *= 2.0;
    }
    return value;
  }

  float getHeight(vec2 p, float hScale, float freq, float octs, float ridge, float flatPow, float plateau) {
    float n = fbmNoise(p + uTime * 0.02, freq, octs);

    // Ridge noise
    if (ridge > 0.0) {
      float ridgeNoise = 1.0 - abs(snoise(p * freq * 0.7 + uTime * 0.015));
      ridgeNoise = pow(ridgeNoise, 2.0);
      n = mix(n, ridgeNoise, ridge);
    }

    // Flatten power
    n = sign(n) * pow(abs(n), flatPow);

    // Plateau
    if (plateau > 0.0) {
      float stepped = floor(n * 4.0) / 4.0;
      n = mix(n, stepped, plateau);
    }

    return n * hScale;
  }

  void main() {
    vUv = uv;

    vec2 pos = position.xz;

    // Current terrain height
    float h1 = getHeight(pos, uHeightScale, uFrequency, uOctaves, uRidgeAmount, uFlattenPower, uPlateauThreshold);

    // Target terrain height
    float h2 = getHeight(pos, uTargetHeightScale, uTargetFrequency, uTargetOctaves, uTargetRidgeAmount, uTargetFlattenPower, uTargetPlateauThreshold);

    // Morph between them
    float h = mix(h1, h2, uMorphProgress);

    vHeight = h / max(mix(uHeightScale, uTargetHeightScale, uMorphProgress), 0.1);

    vec3 displaced = position;
    displaced.y += h;

    // Compute normal from neighbors
    float eps = 0.05;
    float hL = mix(
      getHeight(pos + vec2(-eps, 0.0), uHeightScale, uFrequency, uOctaves, uRidgeAmount, uFlattenPower, uPlateauThreshold),
      getHeight(pos + vec2(-eps, 0.0), uTargetHeightScale, uTargetFrequency, uTargetOctaves, uTargetRidgeAmount, uTargetFlattenPower, uTargetPlateauThreshold),
      uMorphProgress
    );
    float hR = mix(
      getHeight(pos + vec2(eps, 0.0), uHeightScale, uFrequency, uOctaves, uRidgeAmount, uFlattenPower, uPlateauThreshold),
      getHeight(pos + vec2(eps, 0.0), uTargetHeightScale, uTargetFrequency, uTargetOctaves, uTargetRidgeAmount, uTargetFlattenPower, uTargetPlateauThreshold),
      uMorphProgress
    );
    float hD = mix(
      getHeight(pos + vec2(0.0, -eps), uHeightScale, uFrequency, uOctaves, uRidgeAmount, uFlattenPower, uPlateauThreshold),
      getHeight(pos + vec2(0.0, -eps), uTargetHeightScale, uTargetFrequency, uTargetOctaves, uTargetRidgeAmount, uTargetFlattenPower, uTargetPlateauThreshold),
      uMorphProgress
    );
    float hU = mix(
      getHeight(pos + vec2(0.0, eps), uHeightScale, uFrequency, uOctaves, uRidgeAmount, uFlattenPower, uPlateauThreshold),
      getHeight(pos + vec2(0.0, eps), uTargetHeightScale, uTargetFrequency, uTargetOctaves, uTargetRidgeAmount, uTargetFlattenPower, uTargetPlateauThreshold),
      uMorphProgress
    );
    vNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uTargetColorLow;
  uniform vec3 uTargetColorMid;
  uniform vec3 uTargetColorHigh;
  uniform float uMorphProgress;
  uniform float uTime;

  varying float vHeight;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 colorLow = mix(uColorLow, uTargetColorLow, uMorphProgress);
    vec3 colorMid = mix(uColorMid, uTargetColorMid, uMorphProgress);
    vec3 colorHigh = mix(uColorHigh, uTargetColorHigh, uMorphProgress);

    float h = clamp(vHeight * 0.5 + 0.5, 0.0, 1.0);

    vec3 color;
    if (h < 0.5) {
      color = mix(colorLow, colorMid, h * 2.0);
    } else {
      color = mix(colorMid, colorHigh, (h - 0.5) * 2.0);
    }

    // Lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.4;
    float lighting = ambient + diff * 0.6;

    color *= lighting;

    // Subtle fog at edges
    float fog = smoothstep(0.8, 1.0, length(vUv - 0.5) * 2.0);
    vec3 fogColor = vec3(0.992, 0.965, 0.925); // cream
    color = mix(color, fogColor, fog * 0.7);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function HeroCanvas({ landscapeType = 'default' }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    material: THREE.ShaderMaterial | null;
    animationId: number;
    mouseX: number;
    mouseY: number;
    currentType: LandscapeType;
    targetType: LandscapeType;
    morphProgress: number;
    clock: THREE.Clock;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    material: null,
    animationId: 0,
    mouseX: 0,
    mouseY: 0,
    currentType: 'default',
    targetType: 'default',
    morphProgress: 1,
    clock: new THREE.Clock(),
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const state = stateRef.current;
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    state.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    state.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4, 6);
    camera.lookAt(0, 0, 0);
    state.camera = camera;

    // Terrain geometry
    const geometry = new THREE.PlaneGeometry(12, 12, 200, 200);
    geometry.rotateX(-Math.PI / 2);

    const currentParams = TERRAIN_PARAMS[state.currentType];
    const targetParams = TERRAIN_PARAMS[state.targetType];
    const currentColors = COLOR_PALETTES[state.currentType];
    const targetColors = COLOR_PALETTES[state.targetType];

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uHeightScale: { value: currentParams.heightScale },
        uFrequency: { value: currentParams.frequency },
        uOctaves: { value: currentParams.octaves },
        uRidgeAmount: { value: currentParams.ridgeAmount },
        uFlattenPower: { value: currentParams.flattenPower },
        uPlateauThreshold: { value: currentParams.plateauThreshold },
        uTargetHeightScale: { value: targetParams.heightScale },
        uTargetFrequency: { value: targetParams.frequency },
        uTargetOctaves: { value: targetParams.octaves },
        uTargetRidgeAmount: { value: targetParams.ridgeAmount },
        uTargetFlattenPower: { value: targetParams.flattenPower },
        uTargetPlateauThreshold: { value: targetParams.plateauThreshold },
        uMorphProgress: { value: state.morphProgress },
        uColorLow: { value: new THREE.Vector3(...currentColors.low) },
        uColorMid: { value: new THREE.Vector3(...currentColors.mid) },
        uColorHigh: { value: new THREE.Vector3(...currentColors.high) },
        uTargetColorLow: { value: new THREE.Vector3(...targetColors.low) },
        uTargetColorMid: { value: new THREE.Vector3(...targetColors.mid) },
        uTargetColorHigh: { value: new THREE.Vector3(...targetColors.high) },
      },
      side: THREE.DoubleSide,
    });
    state.material = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    const animate = () => {
      state.animationId = requestAnimationFrame(animate);

      const elapsed = state.clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;

      // Morph progress
      if (state.morphProgress < 1) {
        state.morphProgress = Math.min(state.morphProgress + 0.008, 1);
        material.uniforms.uMorphProgress.value = state.morphProgress;

        // When morph completes, swap current to target
        if (state.morphProgress >= 1) {
          state.currentType = state.targetType;
          const p = TERRAIN_PARAMS[state.currentType];
          const c = COLOR_PALETTES[state.currentType];
          material.uniforms.uHeightScale.value = p.heightScale;
          material.uniforms.uFrequency.value = p.frequency;
          material.uniforms.uOctaves.value = p.octaves;
          material.uniforms.uRidgeAmount.value = p.ridgeAmount;
          material.uniforms.uFlattenPower.value = p.flattenPower;
          material.uniforms.uPlateauThreshold.value = p.plateauThreshold;
          material.uniforms.uColorLow.value.set(...c.low);
          material.uniforms.uColorMid.value.set(...c.mid);
          material.uniforms.uColorHigh.value.set(...c.high);
        }
      }

      // Parallax camera tilt
      const targetRotX = -0.6 + state.mouseY * 0.08;
      const targetRotY = state.mouseX * 0.08;
      camera.rotation.x += (targetRotX - camera.rotation.x) * 0.03;
      camera.rotation.y += (targetRotY - camera.rotation.y) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(canvas);

    // Mouse listener
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(state.animationId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      state.renderer = null;
      state.scene = null;
      state.camera = null;
      state.material = null;
    };
  }, [handleMouseMove]);

  // Handle landscape type changes
  useEffect(() => {
    const state = stateRef.current;
    if (landscapeType === state.targetType) return;

    // If currently morphing, finalize the current morph first
    if (state.morphProgress < 1 && state.material) {
      state.currentType = state.targetType;
      const p = TERRAIN_PARAMS[state.currentType];
      const c = COLOR_PALETTES[state.currentType];
      state.material.uniforms.uHeightScale.value = p.heightScale;
      state.material.uniforms.uFrequency.value = p.frequency;
      state.material.uniforms.uOctaves.value = p.octaves;
      state.material.uniforms.uRidgeAmount.value = p.ridgeAmount;
      state.material.uniforms.uFlattenPower.value = p.flattenPower;
      state.material.uniforms.uPlateauThreshold.value = p.plateauThreshold;
      state.material.uniforms.uColorLow.value.set(...c.low);
      state.material.uniforms.uColorMid.value.set(...c.mid);
      state.material.uniforms.uColorHigh.value.set(...c.high);
    }

    // Start new morph
    state.targetType = landscapeType;
    state.morphProgress = 0;

    if (state.material) {
      const tp = TERRAIN_PARAMS[landscapeType];
      const tc = COLOR_PALETTES[landscapeType];
      state.material.uniforms.uTargetHeightScale.value = tp.heightScale;
      state.material.uniforms.uTargetFrequency.value = tp.frequency;
      state.material.uniforms.uTargetOctaves.value = tp.octaves;
      state.material.uniforms.uTargetRidgeAmount.value = tp.ridgeAmount;
      state.material.uniforms.uTargetFlattenPower.value = tp.flattenPower;
      state.material.uniforms.uTargetPlateauThreshold.value = tp.plateauThreshold;
      state.material.uniforms.uTargetColorLow.value.set(...tc.low);
      state.material.uniforms.uTargetColorMid.value.set(...tc.mid);
      state.material.uniforms.uTargetColorHigh.value.set(...tc.high);
      state.material.uniforms.uMorphProgress.value = 0;
    }
  }, [landscapeType]);

  return (
    <canvas
      ref={canvasRef}
      id="hero-canvas"
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
