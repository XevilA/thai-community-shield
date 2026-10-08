import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as THREE from 'three';
import { INITIAL_HOUSEHOLDS } from '@community-shield/shared';

interface Community3DViewerProps {
  waterLevelMeters: number;
  alleyWaterDepthCm: number;
  activeStepTime: string;
  onSelectHouse: (houseId: string) => void;
  selectedHouseId: string | null;
  isReplanningActive: boolean;
}

export const Community3DViewer: React.FC<Community3DViewerProps> = ({
  waterLevelMeters,
  alleyWaterDepthCm,
  activeStepTime,
  onSelectHouse,
  selectedHouseId,
  isReplanningActive,
}) => {
  const containerRef = useRef<any>(null);
  const [cameraMode, setCameraMode] = useState<'isometric' | 'topdown' | 'closeup'>('isometric');

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const houseMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A1120'); // Atmospheric dark navy
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(160, 180, 210);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    containerRef.current.replaceChildren(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    sunLight.position.set(80, 150, 100);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 5. Terrain Ground Slab
    const groundGeo = new THREE.BoxGeometry(200, 4, 190);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#27342B', roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -2, 0);
    scene.add(ground);

    // Roads
    const roadMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 });
    // Main Road
    const mainRoadGeo = new THREE.BoxGeometry(200, 0.2, 12);
    const mainRoad = new THREE.Mesh(mainRoadGeo, roadMat);
    mainRoad.position.set(0, 0.1, -25);
    scene.add(mainRoad);

    // Secondary Alleys
    const alleyMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5 });
    const alley1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 120), alleyMat);
    alley1.position.set(-50, 0.1, 25);
    scene.add(alley1);

    const alley2 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 120), alleyMat);
    alley2.position.set(15, 0.1, 25);
    scene.add(alley2);

    // 6. Chao Phraya Canal Channel
    const canalGeo = new THREE.BoxGeometry(24, 6, 190);
    const canalMat = new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.9 });
    const canal = new THREE.Mesh(canalGeo, canalMat);
    canal.position.set(70, -2.5, 0);
    scene.add(canal);

    // 7. Dynamic Water Plane (Responsive to waterLevelMeters)
    const waterGeo = new THREE.BoxGeometry(198, 1, 188);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.2,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    // Initial water elevation
    waterMesh.position.set(0, -1.8 + waterLevelMeters * 2.5, 0);
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 8. Bridge over canal
    const bridgeGeo = new THREE.BoxGeometry(32, 1.5, 14);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.4 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(70, 0.8, -25);
    scene.add(bridge);

    // 9. Community Center & Health Center
    const communityCenter = new THREE.Mesh(
      new THREE.BoxGeometry(25, 8, 19),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.5 })
    );
    communityCenter.position.set(37, 4, 18);
    scene.add(communityCenter);

    const healthCenter = new THREE.Mesh(
      new THREE.BoxGeometry(22, 6, 14),
      new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.5 })
    );
    healthCenter.position.set(28, 3, -55);
    scene.add(healthCenter);

    // 10. The 16 Houses
    INITIAL_HOUSEHOLDS.forEach((house) => {
      const isCriticalHouse = house.code === 'A-012';
      const houseMat = new THREE.MeshStandardMaterial({
        color: isCriticalHouse ? '#DC2626' : house.houseType === 'House_Type_D_Raised_Timber' ? '#B45309' : '#94A3B8',
        roughness: 0.6,
      });

      const hGeo = new THREE.BoxGeometry(10, house.floorElevationMeters * 3 + 4, 9);
      const mesh = new THREE.Mesh(hGeo, houseMat);
      // Map 2D coordinates into 3D space
      mesh.position.set(house.coordinates.x, (house.floorElevationMeters * 3 + 4) / 2, house.coordinates.y);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Pin Marker over House A-012
      if (isCriticalHouse) {
        const pinGeo = new THREE.ConeGeometry(2, 6, 8);
        const pinMat = new THREE.MeshBasicMaterial({ color: '#EF4444' });
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.rotation.x = Math.PI;
        pin.position.set(house.coordinates.x, 14, house.coordinates.y);
        scene.add(pin);
      }

      houseMeshesRef.current.set(house.id, mesh);
    });

    // Medical Point B Pin
    const medPinGeo = new THREE.ConeGeometry(2.5, 7, 8);
    const medPinMat = new THREE.MeshBasicMaterial({ color: '#38BDF8' });
    const medPin = new THREE.Mesh(medPinGeo, medPinMat);
    medPin.rotation.x = Math.PI;
    medPin.position.set(37, 16, -10);
    scene.add(medPin);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Gentle water ripple wave effect
      if (waterMeshRef.current) {
        waterMeshRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // Update water level mesh dynamically
  useEffect(() => {
    if (waterMeshRef.current) {
      // Interpolate water level height
      const targetY = -1.8 + waterLevelMeters * 2.8;
      waterMeshRef.current.position.y = targetY;

      // When water reaches high levels, adjust color to alarming turbidity
      const mat = waterMeshRef.current.material as THREE.MeshStandardMaterial;
      if (waterLevelMeters >= 0.72) {
        mat.color.set('#B45309'); // Muddy overflow tone
        mat.opacity = 0.8;
      } else {
        mat.color.set('#0284C7');
        mat.opacity = 0.65;
      }
    }
  }, [waterLevelMeters]);

  // Handle Camera Presets
  const setCameraPreset = (mode: 'isometric' | 'topdown' | 'closeup') => {
    setCameraMode(mode);
    if (!cameraRef.current) return;

    if (mode === 'isometric') {
      cameraRef.current.position.set(160, 180, 210);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (mode === 'topdown') {
      cameraRef.current.position.set(0, 250, 0);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (mode === 'closeup') {
      // Zoom right into House A-012 (-7, 80)
      cameraRef.current.position.set(25, 45, 110);
      cameraRef.current.lookAt(-7, 2, 80);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* 3D WebGL Canvas Holder */}
      {Platform.OS === 'web' ? (
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />
      ) : (
        <View style={styles.nativeFallback}>
          <Text style={styles.fallbackTitle}>3D Interactive Viewport</Text>
          <Text style={styles.fallbackText}>Model: thai_community_visible_low_areas.glb</Text>
        </View>
      )}

      {/* 3D Viewport Controls & HUD Overlay */}
      <View style={styles.hudTopRight}>
        <View style={styles.depthIndicator}>
          <Text style={styles.depthLabel}>ระดับน้ำจำลอง</Text>
          <Text style={styles.depthValue}>{waterLevelMeters.toFixed(2)} ม.</Text>
          <Text style={styles.depthSub}>น้ำท่วมซอยลุ่มต่ำ ≈ {alleyWaterDepthCm} ซม.</Text>
        </View>

        <View style={styles.camBtnRow}>
          <TouchableOpacity
            style={[styles.camBtn, cameraMode === 'isometric' && styles.camBtnActive]}
            onPress={() => setCameraPreset('isometric')}
          >
            <Text style={styles.camBtnText}>📐 ไอโซเมตริก</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.camBtn, cameraMode === 'topdown' && styles.camBtnActive]}
            onPress={() => setCameraPreset('topdown')}
          >
            <Text style={styles.camBtnText}>🗺️ มุมมองบน</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.camBtn, cameraMode === 'closeup' && styles.camBtnActive]}
            onPress={() => setCameraPreset('closeup')}
          >
            <Text style={[styles.camBtnText, styles.camBtnTextAlert]}>🎯 เจาะจง A-012</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Legend Bar */}
      <View style={styles.hudBottomLeft}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>บ้าน A-012 (ผู้ป่วยติดเตียง)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#38BDF8' }]} />
          <Text style={styles.legendText}>จุดส่งต่อการแพทย์ B</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendText}>สุขศาลา / ศูนย์สุขภาพ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#B45309' }]} />
          <Text style={styles.legendText}>เรือนไม้ใต้ถุนสูง (รอดน้ำ)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 420,
    backgroundColor: '#0A1120',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  fallbackTitle: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
  },
  fallbackText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  hudTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    alignItems: 'flex-end',
    gap: 8,
  },
  depthIndicator: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'flex-end',
  },
  depthLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  depthValue: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '800',
  },
  depthSub: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  camBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  camBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  camBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  camBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  camBtnTextAlert: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  hudBottomLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
});
