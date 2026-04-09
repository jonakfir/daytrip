"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Destination {
  name: string;
  lat: number;
  lng: number;
}

const destinations: Destination[] = [
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
  { name: "Marrakech", lat: 31.6295, lng: -7.9811 },
  { name: "Amalfi Coast", lat: 40.634, lng: 14.602 },
  { name: "Santorini", lat: 36.3932, lng: 25.4615 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
  { name: "Bali", lat: -8.3405, lng: 115.092 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Reykjavik", lat: 64.1466, lng: -21.9426 },
  { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
];

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDest, setHoveredDest] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 280;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const radius = 90;

    // Globe group (everything rotates together)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Inner solid sphere (subtle fill)
    const sphereGeo = new THREE.SphereGeometry(radius, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x6b8f71,
      transparent: true,
      opacity: 0.08,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // Wireframe overlay (latitude/longitude lines)
    const wireframeGeo = new THREE.SphereGeometry(radius + 0.3, 36, 24);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x6b8f71,
      transparent: true,
      opacity: 0.35,
    });
    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(wireframeGeo),
      wireframeMat
    );
    globeGroup.add(wireframe);

    // Generate dots on the sphere surface to simulate land mass density
    // We use a noise-based approach to distribute dots — higher density on "land"
    const dotCount = 2800;
    const dotGeometry = new THREE.BufferGeometry();
    const dotPositions: number[] = [];
    const dotColors: number[] = [];

    // Pseudo-random deterministic function
    const hash = (x: number, y: number, z: number): number => {
      let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
      return h - Math.floor(h);
    };

    // Approximate land masks using lat/lng ranges (rough continents)
    const isLand = (lat: number, lng: number): boolean => {
      // North America
      if (lat > 15 && lat < 72 && lng > -170 && lng < -50) {
        if (lat > 50 && lng < -130) return hash(lat, lng, 1) > 0.3;
        if (lat < 30 && lng < -100) return hash(lat, lng, 2) > 0.5;
        return hash(lat, lng, 3) > 0.25;
      }
      // Greenland
      if (lat > 60 && lat < 84 && lng > -55 && lng < -20) return hash(lat, lng, 4) > 0.3;
      // South America
      if (lat > -56 && lat < 13 && lng > -82 && lng < -34) {
        if (lat < -40) return hash(lat, lng, 5) > 0.6;
        return hash(lat, lng, 6) > 0.3;
      }
      // Europe
      if (lat > 36 && lat < 71 && lng > -10 && lng < 40) return hash(lat, lng, 7) > 0.3;
      // UK / Scandinavia
      if (lat > 49 && lat < 71 && lng > -10 && lng < 32) return hash(lat, lng, 8) > 0.4;
      // Africa
      if (lat > -35 && lat < 37 && lng > -18 && lng < 52) {
        if (lat > 15 && lng > 0 && lng < 35) return hash(lat, lng, 9) > 0.2; // Sahara dense
        return hash(lat, lng, 10) > 0.3;
      }
      // Middle East
      if (lat > 12 && lat < 40 && lng > 34 && lng < 62) return hash(lat, lng, 11) > 0.35;
      // Russia / Siberia
      if (lat > 45 && lat < 78 && lng > 30 && lng < 180) return hash(lat, lng, 12) > 0.35;
      // Central Asia
      if (lat > 30 && lat < 55 && lng > 45 && lng < 100) return hash(lat, lng, 13) > 0.4;
      // India
      if (lat > 6 && lat < 36 && lng > 68 && lng < 97) return hash(lat, lng, 14) > 0.3;
      // China / East Asia
      if (lat > 18 && lat < 54 && lng > 73 && lng < 135) return hash(lat, lng, 15) > 0.35;
      // Southeast Asia
      if (lat > -11 && lat < 24 && lng > 92 && lng < 142) return hash(lat, lng, 16) > 0.55;
      // Japan
      if (lat > 30 && lat < 46 && lng > 128 && lng < 146) return hash(lat, lng, 17) > 0.5;
      // Australia
      if (lat > -44 && lat < -10 && lng > 112 && lng < 154) return hash(lat, lng, 18) > 0.3;
      // New Zealand
      if (lat > -47 && lat < -34 && lng > 166 && lng < 179) return hash(lat, lng, 19) > 0.5;
      // Indonesia archipelago
      if (lat > -11 && lat < 6 && lng > 95 && lng < 141) return hash(lat, lng, 20) > 0.65;
      return false;
    };

    const terracottaColor = new THREE.Color(0xc4522a);
    const sageColor = new THREE.Color(0x6b8f71);

    for (let i = 0; i < dotCount; i++) {
      // Even distribution across sphere using fibonacci lattice
      const theta = (i / dotCount) * Math.PI * 2 * 137.508;
      const y = 1 - (i / (dotCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Convert to lat/lng for land check
      const lat = Math.asin(y) * (180 / Math.PI);
      const lng = Math.atan2(z, x) * (180 / Math.PI);

      if (isLand(lat, lng)) {
        const r = radius + 0.6;
        dotPositions.push(x * r, y * r, z * r);
        dotColors.push(sageColor.r, sageColor.g, sageColor.b);
      }
    }

    dotGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(dotPositions, 3)
    );
    dotGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(dotColors, 3)
    );

    const dotMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    const dots = new THREE.Points(dotGeometry, dotMaterial);
    globeGroup.add(dots);

    // Destination markers (terracotta)
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);

    destinations.forEach((dest) => {
      const pos = latLngToVec3(dest.lat, dest.lng, radius + 1);
      // Glow ring
      const ringGeo = new THREE.RingGeometry(2, 3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: terracottaColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.rotateX(Math.PI);
      markerGroup.add(ring);

      // Solid dot
      const dotGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: terracottaColor });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData.name = dest.name;
      markerGroup.add(dot);

      // Pulse beam
      const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: terracottaColor,
        transparent: true,
        opacity: 0.7,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(pos.clone().multiplyScalar(1.03));
      beam.lookAt(pos.clone().multiplyScalar(2));
      beam.rotateX(Math.PI / 2);
      markerGroup.add(beam);
    });

    // Mouse interaction — drag to rotate
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityY = 0.003;
    let rotationVelocityX = 0;
    let targetRotationX = 0.15;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      globeGroup.rotation.y += dx * 0.005;
      targetRotationX += dy * 0.005;
      targetRotationX = Math.max(-0.8, Math.min(0.8, targetRotationX));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const onTouchEnd = () => {
      isDragging = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseX;
      const dy = e.touches[0].clientY - prevMouseY;
      globeGroup.rotation.y += dx * 0.005;
      targetRotationX += dy * 0.005;
      targetRotationX = Math.max(-0.8, Math.min(0.8, targetRotationX));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // Raycaster for hover
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 3 };
    const mouse = new THREE.Vector2();

    const onHoverMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        markerGroup.children.filter((c) => c.userData.name)
      );
      if (intersects.length > 0) {
        setHoveredDest(intersects[0].object.userData.name as string);
        container.style.cursor = "pointer";
      } else {
        setHoveredDest(null);
        container.style.cursor = isDragging ? "grabbing" : "grab";
      }
    };
    container.addEventListener("mousemove", onHoverMove);

    // Resize
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Animation loop
    let animationId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth idle rotation when not dragging
      if (!isDragging) {
        globeGroup.rotation.y += rotationVelocityY;
      }
      // Lerp X rotation toward target
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;

      // Pulse animation on destination rings
      markerGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          const scale = 1 + Math.sin(elapsed * 2.5) * 0.3;
          child.scale.setScalar(scale);
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.3 + Math.sin(elapsed * 2.5 + 1) * 0.2;
        }
      });

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("mousemove", onHoverMove);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
    };
  }, []);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="mx-auto w-full max-w-2xl aspect-square"
        style={{ cursor: "grab" }}
      />
      {hoveredDest && (
        <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-charcoal-900/90 px-4 py-1.5 font-sans text-body-sm text-cream-50 backdrop-blur-sm">
          {hoveredDest}
        </div>
      )}
      <p className="mt-6 text-center font-sans text-caption text-charcoal-800/50">
        Drag to rotate · 15 destinations worldwide
      </p>
    </div>
  );
}
