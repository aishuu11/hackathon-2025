'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import AvatarSpeechBubble from './AvatarSpeechBubble';

// @ts-ignore - Type mismatch between three-stdlib and @types/three
import { GLTFLoader } from 'three-stdlib';
// @ts-ignore - Type mismatch between three-stdlib and @types/three
import { OrbitControls } from 'three-stdlib';

interface VRMAvatarProps {
  isTyping?: boolean;
  isWaving?: boolean;
  calories?: number | null;
  foodName?: string;
  answerType?: 'myth' | 'fact' | 'general';
  myTake?: string | null;
}

export default function VRMAvatar({ isTyping = false, isWaving = false, calories = null, foodName = '', answerType = 'general', myTake = null }: VRMAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vrmRef = useRef<any>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const isTypingRef = useRef<boolean>(false);
  const isWavingRef = useRef<boolean>(false);
  const waveStartTimeRef = useRef<number>(0);
  const calorieHologramRef = useRef<THREE.Group | null>(null);
  const hologramAnchorRef = useRef<THREE.Group | null>(null);
  const hologramColorRef = useRef<THREE.Color>(new THREE.Color(0x00ffff));
  const targetColorRef = useRef<THREE.Color>(new THREE.Color(0x00ffff));
  
  useEffect(() => {
    isTypingRef.current = isTyping;
    console.log('✓ isTyping updated:', isTyping);
  }, [isTyping]);

  useEffect(() => {
    if (isWaving && !isWavingRef.current) {
      isWavingRef.current = true;
      waveStartTimeRef.current = Date.now();
      console.log('👋 Starting wave animation!');
      setTimeout(() => {
        isWavingRef.current = false;
        console.log('👋 Wave animation complete');
      }, 1500);
    }
  }, [isWaving]);

  const getNutritionColor = (calories: number): number => {
    if (calories < 200) return 0x00ff00;
    if (calories < 350) return 0x88ff00;
    if (calories < 500) return 0xffff00;
    if (calories < 650) return 0xff8800;
    return 0xff0000;
  };

  const createCalorieHologram = (vrm: any, calories: number, foodName: string, isMythOrFact: 'myth' | 'fact' | 'general' = 'general'): THREE.Group => {
    const hologramGroup = new THREE.Group();
    const leftHandBone = vrm.humanoid.getBoneNode('leftHand');
    
    if (!leftHandBone) {
      console.warn('Left hand bone not found');
      return new THREE.Group();
    }

    const hologramAnchor = new THREE.Group();
    hologramAnchor.position.set(0, 0, 0);
    leftHandBone.add(hologramAnchor);
    hologramAnchorRef.current = hologramAnchor;

    // Determine colors based on myth/fact status
    let primaryColor: THREE.Color;
    let secondaryColor: THREE.Color;
    
    if (isMythOrFact === 'myth') {
      // RED for myths
      primaryColor = new THREE.Color(0xff0044);
      secondaryColor = new THREE.Color(0xff3366);
    } else if (isMythOrFact === 'fact') {
      // GREEN for facts
      primaryColor = new THREE.Color(0x00ff88);
      secondaryColor = new THREE.Color(0x00ffaa);
    } else {
      // CYAN for general/calorie info
      primaryColor = new THREE.Color(0x00ffff);
      secondaryColor = new THREE.Color(0x00ff88);
    }
    
    targetColorRef.current.copy(primaryColor);

    // OUTER AURA - Soft glow
    const auraGeometry = new THREE.CircleGeometry(0.12, 64);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.position.z = -0.002;
    hologramGroup.add(aura);

    // MULTIPLE TRANSPARENT GLOWING RINGS - Depth layers
    const ringLayers = [
      { radius: 0.095, thickness: 0.001, opacity: 0.6, color: primaryColor },
      { radius: 0.085, thickness: 0.0015, opacity: 0.7, color: secondaryColor },
      { radius: 0.075, thickness: 0.001, opacity: 0.5, color: primaryColor },
      { radius: 0.065, thickness: 0.002, opacity: 0.8, color: secondaryColor }
    ];

    ringLayers.forEach((ring, index) => {
      const ringGeometry = new THREE.RingGeometry(ring.radius - ring.thickness, ring.radius + ring.thickness, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: ring.color,
        transparent: true,
        opacity: ring.opacity,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.z = index * 0.0005;
      hologramGroup.add(ringMesh);
    });

    // ROTATING HUD ARCS - Iron Man style
    const arcSegments = new THREE.Group();
    const arcConfigs = [
      { start: 0, length: Math.PI / 3, radius: 0.098, speed: 0.8 },
      { start: Math.PI, length: Math.PI / 3, radius: 0.098, speed: -0.6 },
      { start: Math.PI / 2, length: Math.PI / 4, radius: 0.088, speed: 1.2 },
      { start: 3 * Math.PI / 2, length: Math.PI / 4, radius: 0.088, speed: -0.9 }
    ];

    arcConfigs.forEach((config, i) => {
      const arcGeometry = new THREE.RingGeometry(config.radius - 0.002, config.radius + 0.002, 64, 1, config.start, config.length);
      const arcMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const arc = new THREE.Mesh(arcGeometry, arcMaterial);
      arc.userData.rotationSpeed = config.speed;
      arcSegments.add(arc);
    });
    arcSegments.userData.isArcGroup = true;
    hologramGroup.add(arcSegments);

    // SMALL ANIMATED TICKS - Clean minimal sci-fi
    const ticksGroup = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const tickGeometry = new THREE.PlaneGeometry(0.002, i % 4 === 0 ? 0.012 : 0.008);
      const tickMaterial = new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? secondaryColor : primaryColor,
        transparent: true,
        opacity: i % 4 === 0 ? 0.9 : 0.6,
        side: THREE.DoubleSide
      });
      const tick = new THREE.Mesh(tickGeometry, tickMaterial);
      const radius = 0.092;
      tick.position.x = Math.cos(angle) * radius;
      tick.position.y = Math.sin(angle) * radius;
      tick.rotation.z = angle + Math.PI / 2;
      tick.userData.baseAngle = angle;
      tick.userData.highlight = i % 4 === 0;
      ticksGroup.add(tick);
    }
    ticksGroup.userData.animationOffset = 0;
    hologramGroup.add(ticksGroup);

    // FLOATING PARTICLES - AR projection feel
    const particlesGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const particleGeometry = new THREE.CircleGeometry(0.001, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.03;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.y = Math.sin(angle) * radius;
      particle.position.z = 0.001 + Math.random() * 0.002;
      particle.userData.baseAngle = angle;
      particle.userData.orbitSpeed = 0.2 + Math.random() * 0.3;
      particle.userData.floatSpeed = 1 + Math.random() * 2;
      particlesGroup.add(particle);
    }
    particlesGroup.userData.isParticles = true;
    hologramGroup.add(particlesGroup);

    // SCANLINE TEXTURE - Subtle cyberpunk effect
    const scanlineCanvas = document.createElement('canvas');
    scanlineCanvas.width = 256;
    scanlineCanvas.height = 256;
    const scanCtx = scanlineCanvas.getContext('2d')!;
    
    // Create scanline pattern
    for (let y = 0; y < 256; y += 3) {
      scanCtx.fillStyle = y % 6 === 0 ? 'rgba(0, 255, 136, 0.03)' : 'rgba(0, 255, 255, 0.02)';
      scanCtx.fillRect(0, y, 256, 1);
    }
    
    const scanlineTexture = new THREE.CanvasTexture(scanlineCanvas);
    const scanlineMaterial = new THREE.MeshBasicMaterial({
      map: scanlineTexture,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const scanlineMesh = new THREE.Mesh(new THREE.CircleGeometry(0.1, 64), scanlineMaterial);
    scanlineMesh.position.z = 0.003;
    hologramGroup.add(scanlineMesh);

    // MAIN CONTENT - Bold number with neon outline
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get color strings
    const primaryHex = '#' + primaryColor.getHexString();
    const secondaryHex = '#' + secondaryColor.getHexString();
    
    if (isMythOrFact === 'myth' || isMythOrFact === 'fact') {
      // Show MYTH or FACT label prominently
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 25;
      ctx.fillStyle = primaryHex;
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 4;
      ctx.font = 'bold 120px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const statusText = isMythOrFact === 'myth' ? 'MYTH' : 'FACT';
      ctx.strokeText(statusText, canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText(statusText, canvas.width / 2, canvas.height / 2 - 30);
      
      // Show ✗ or ✓ symbol
      ctx.shadowBlur = 20;
      ctx.font = 'bold 80px Arial';
      const symbol = isMythOrFact === 'myth' ? '✗' : '✓';
      ctx.fillText(symbol, canvas.width / 2, canvas.height / 2 + 50);
      
      // Food name
      ctx.shadowBlur = 8;
      ctx.font = '20px "Courier New", monospace';
      ctx.fillStyle = primaryHex + 'cc';
      const truncatedName = foodName.length > 15 ? foodName.substring(0, 15) + '...' : foodName;
      ctx.fillText(truncatedName.toUpperCase(), canvas.width / 2, canvas.height / 2 + 100);
    } else {
      // Show calorie number for general queries
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 20;
      ctx.fillStyle = primaryHex;
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 3;
      ctx.font = 'bold 140px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Number with outline
      ctx.strokeText(`${calories}`, canvas.width / 2, canvas.height / 2 - 40);
      ctx.fillText(`${calories}`, canvas.width / 2, canvas.height / 2 - 40);
      
      // CALORIES label
      ctx.shadowBlur = 10;
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillStyle = secondaryHex;
      ctx.fillText('CALORIES', canvas.width / 2, canvas.height / 2 + 40);
      
      // Food name
      ctx.shadowBlur = 8;
      ctx.font = '20px "Courier New", monospace';
      ctx.fillStyle = primaryHex + 'cc';
      const truncatedName = foodName.length > 15 ? foodName.substring(0, 15) + '...' : foodName;
      ctx.fillText(truncatedName.toUpperCase(), canvas.width / 2, canvas.height / 2 + 80);
    }
    
    // Corner brackets for Iron Man HUD style
    const drawCornerBracket = (x: number, y: number, flipX: number, flipY: number) => {
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + flipX * 25, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + flipY * 25);
      ctx.stroke();
    };
    
    const margin = 100;
    drawCornerBracket(margin, margin, 1, 1);
    drawCornerBracket(canvas.width - margin, margin, -1, 1);
    drawCornerBracket(margin, canvas.height - margin, 1, -1);
    drawCornerBracket(canvas.width - margin, canvas.height - margin, -1, -1);
    
    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.needsUpdate = true;
    const textMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const textMesh = new THREE.Mesh(new THREE.CircleGeometry(0.095, 64), textMaterial);
    textMesh.position.z = 0.004;
    hologramGroup.add(textMesh);

    // SCANNING BAR - Medical scanner effect
    const scanBarGeometry = new THREE.PlaneGeometry(0.19, 0.003);
    const scanBarMaterial = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const scanBar = new THREE.Mesh(scanBarGeometry, scanBarMaterial);
    scanBar.position.z = 0.005;
    scanBar.userData.isScanBar = true;
    hologramGroup.add(scanBar);

    // LIGHT REFRACTIONS - Inner glow effects
    for (let i = 0; i < 3; i++) {
      const glowGeometry = new THREE.RingGeometry(0.04 + i * 0.015, 0.041 + i * 0.015, 64);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.15 - i * 0.03,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = 0.001 + i * 0.0003;
      glow.userData.pulseOffset = i * 0.5;
      glow.userData.isGlow = true;
      hologramGroup.add(glow);
    }
    
    hologramGroup.rotation.set(0, 0, 0);
    hologramGroup.rotation.x = -0.25;
    hologramGroup.scale.set(1, 1, 1);
    
    hologramAnchor.add(hologramGroup);
    console.log(`✓ High-tech hologram created: ${calories} cal for ${foodName}`);
    
    return hologramGroup;
  };

  useEffect(() => {
    if (vrmRef.current && calories !== null && calories > 0) {
      console.log(`🔮 Creating hologram for ${calories} calories of ${foodName} (Type: ${answerType})`);
      
      // Remove existing hologram if any
      if (calorieHologramRef.current && hologramAnchorRef.current) {
        const leftHandBone = vrmRef.current.humanoid.getBoneNode('leftHand');
        if (leftHandBone && hologramAnchorRef.current.parent === leftHandBone) {
          leftHandBone.remove(hologramAnchorRef.current);
          console.log('✓ Removed old hologram');
        }
      }
      
      const hologram = createCalorieHologram(vrmRef.current, calories, foodName, answerType);
      calorieHologramRef.current = hologram;
      
      console.log('✅ Hologram created and attached!');
    } else if (vrmRef.current && calorieHologramRef.current && calories === null) {
      if (hologramAnchorRef.current) {
        const leftHandBone = vrmRef.current.humanoid.getBoneNode('leftHand');
        if (leftHandBone && hologramAnchorRef.current.parent === leftHandBone) {
          leftHandBone.remove(hologramAnchorRef.current);
          calorieHologramRef.current = null;
          hologramAnchorRef.current = null;
          console.log('✓ Calorie hologram removed');
        }
      }
    }
  }, [calories, foodName, answerType]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 1.3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xfff8e1, 1.2); // Warm white, much brighter
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.4); // Warm light, much brighter
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add fill light from the left for better illumination
    const fillLight = new THREE.DirectionalLight(0xfff0d9, 0.8);
    fillLight.position.set(-1, 0.5, 0.5);
    scene.add(fillLight);

    // Add rim light from behind for depth
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 1, -1);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Fake ground shadow - Pink neon gradient
    const shadowGeometry = new THREE.PlaneGeometry(1.5, 0.8);
    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 256;
    gradientCanvas.height = 128;
    const ctx = gradientCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 64, 0, 128, 64, 128);
    gradient.addColorStop(0, 'rgba(255, 95, 175, 0.6)'); // Bright pink center
    gradient.addColorStop(0.5, 'rgba(255, 95, 175, 0.3)'); // Medium pink
    gradient.addColorStop(1, 'rgba(255, 95, 175, 0)'); // Fade to transparent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 128);
    const shadowTexture = new THREE.CanvasTexture(gradientCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    scene.add(shadow);

    const loader = new GLTFLoader();
    // @ts-ignore
    loader.register((parser: any) => new VRMLoaderPlugin(parser));

    loader.load(
      '/avaturn_avatar.vrm',
      (gltf: any) => {
        try {
          const vrm = gltf.userData.vrm;
          if (vrm) {
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.removeUnnecessaryJoints(gltf.scene);
            vrmRef.current = vrm;
            scene.add(vrm.scene);

            vrm.scene.rotation.y = Math.PI;

            if (vrm.humanoid) {
              const head = vrm.humanoid.getNormalizedBoneNode('head');
              if (head) head.rotation.x = -0.3;

              const leftEye = vrm.humanoid.getNormalizedBoneNode('leftEye');
              const rightEye = vrm.humanoid.getNormalizedBoneNode('rightEye');
              if (leftEye) leftEye.rotation.x = 0.3;
              if (rightEye) rightEye.rotation.x = 0.3;
            }

            console.log('VRM loaded successfully');
            
            // Create a test hologram immediately for visibility
            setTimeout(() => {
              if (vrmRef.current) {
                const testHologram = createCalorieHologram(vrmRef.current, 250, 'Sample Food', 'general');
                calorieHologramRef.current = testHologram;
                console.log('✨ Test hologram created on load!');
              }
            }, 500);
          } else {
            scene.add(gltf.scene);
            console.log('GLTF model loaded successfully');
          }

          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(gltf.scene);
            gltf.animations.forEach((clip: THREE.AnimationClip) => {
              const action = mixer.clipAction(clip);
              action.play();
            });
            mixerRef.current = mixer;
          }

          setLoading(false);
        } catch (err) {
          console.error('Error processing VRM:', err);
          setError('Failed to process VRM avatar');
          setLoading(false);
        }
      },
      (progress: any) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
        console.log(`Loading progress: ${percent}%`);
      },
      (err: any) => {
        console.error('Error loading VRM:', err);
        setError('Failed to load VRM avatar');
        setLoading(false);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();
      const time = Date.now() * 0.001;

      if (vrmRef.current) {
        vrmRef.current.update(deltaTime);
        const vrm = vrmRef.current;

        if (vrm.humanoid) {
          const chest = vrm.humanoid.getNormalizedBoneNode('chest') || vrm.humanoid.getNormalizedBoneNode('upperChest');
          const breathCycle = Math.sin(time * 0.4);
          const inhale = breathCycle * 0.08;
          
          if (chest) {
            chest.rotation.x = inhale;
            chest.position.z = inhale * 0.03;
          }
          
          const head = vrm.humanoid.getNormalizedBoneNode('head');
          const leftEye = vrm.humanoid.getNormalizedBoneNode('leftEye');
          const rightEye = vrm.humanoid.getNormalizedBoneNode('rightEye');
          
          if (head) {
            if (isTypingRef.current) {
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.7, 0.08);
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.5, 0.08);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.05, 0.08);
              if (leftEye) leftEye.rotation.x = THREE.MathUtils.lerp(leftEye.rotation.x, 0.15, 0.08);
              if (rightEye) rightEye.rotation.x = THREE.MathUtils.lerp(rightEye.rotation.x, 0.15, 0.08);
            } else {
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.02);
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.3, 0.02);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, 0.02);
              if (leftEye) leftEye.rotation.x = THREE.MathUtils.lerp(leftEye.rotation.x, 0.3, 0.02);
              if (rightEye) rightEye.rotation.x = THREE.MathUtils.lerp(rightEye.rotation.x, 0.3, 0.02);
            }
          }
          
          const leftShoulder  = vrm.humanoid.getNormalizedBoneNode('leftShoulder');
          const rightShoulder = vrm.humanoid.getNormalizedBoneNode('rightShoulder');
          const leftUpperArm  = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
          const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
          const leftLowerArm  = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
          const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
          const leftHand      = vrm.humanoid.getNormalizedBoneNode('leftHand');
          const rightHand     = vrm.humanoid.getNormalizedBoneNode('rightHand');
          
          if (isWavingRef.current) {
            // Wave pose (you can tweak later if you want)
            if (rightShoulder) {
              rightShoulder.rotation.set(0.15, 0, 0);
            }
            if (rightUpperArm) {
              rightUpperArm.rotation.set(-0.6, 0.15, -0.35);
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.set(-0.8, 0, 0.15);
            }
            if (rightHand) {
              rightHand.rotation.set(0.1, -Math.PI / 2 + 0.2, 0.25 + Math.sin(time * 8) * 0.2);
            }

            if (leftShoulder) {
              leftShoulder.rotation.set(inhale * 0.5, 0, 0);
            }
            if (leftUpperArm) {
              leftUpperArm.rotation.z = 1.4 + Math.sin(time * 0.3) * 0.03;
              leftUpperArm.rotation.x = 0.3 + breathCycle * 0.02;
              leftUpperArm.rotation.y = 0.1;
            }
            if (leftLowerArm) {
              leftLowerArm.rotation.set(0, 0, -0.2 + Math.sin(time * 0.4) * 0.02);
            }
          } else {
            // ======= IDLE POSE =======

            // Left arm - hanging naturally down the body
            if (leftShoulder) {
              leftShoulder.rotation.set(0.05, 0, 0.15);
            }
            if (leftUpperArm) {
              leftUpperArm.rotation.z = 1.15;  // hang down with visible hands
              leftUpperArm.rotation.x = 0.05;
              leftUpperArm.rotation.y = -0.25;
            }
            if (leftLowerArm) {
              leftLowerArm.rotation.z = -0.05;
              leftLowerArm.rotation.x = 0;
              leftLowerArm.rotation.y = 0;
            }
            if (leftHand) {
              leftHand.rotation.x = 0.15;
              leftHand.rotation.y = 0;
              leftHand.rotation.z = 0.1;
            }
            
            // Left hand fingers relaxed
            const leftThumb = vrm.humanoid.getBoneNode('leftThumbProximal');
            const leftIndex = vrm.humanoid.getBoneNode('leftIndexProximal');
            const leftMiddle = vrm.humanoid.getBoneNode('leftMiddleProximal');
            const leftRing = vrm.humanoid.getBoneNode('leftRingProximal');
            
            if (leftThumb) leftThumb.rotation.x = 0.15;
            if (leftIndex) leftIndex.rotation.x = 0.2;
            if (leftMiddle) leftMiddle.rotation.x = 0.2;
            if (leftRing) leftRing.rotation.x = 0.2;
            
            // Right arm - hanging naturally down the body
            if (rightShoulder) {
              rightShoulder.rotation.set(0.05, 0, -0.15);
            }
            if (rightUpperArm) {
              rightUpperArm.rotation.z = -1.15;  // hang down with visible hands
              rightUpperArm.rotation.x = 0.05;
              rightUpperArm.rotation.y = 0.25;
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.z = 0.05;
              rightLowerArm.rotation.x = 0;
              rightLowerArm.rotation.y = 0;
            }
            if (rightHand) {
              rightHand.rotation.x = 0.15;
              rightHand.rotation.y = 0;
              rightHand.rotation.z = -0.1;
            }
          }

          // Fingers
          const fingers = [
            'leftThumbProximal', 'leftIndexProximal', 'leftMiddleProximal', 'leftRingProximal', 'leftLittleProximal',
            'rightThumbProximal', 'rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal'
          ];
          
          fingers.forEach((fingerName, index) => {
            const finger = vrm.humanoid.getNormalizedBoneNode(fingerName);
            if (!finger) return;
            const phase = index * 0.5;
            const isLeft = fingerName.startsWith('left');
            
            if (fingerName.includes('Thumb')) {
              finger.rotation.z = (isLeft ? 1 : -1) * 0.3;
              finger.rotation.x = 0;
              finger.rotation.y = (isLeft ? 1 : -1) * 0.2;
            } else {
              if (!isWavingRef.current) {
                finger.rotation.z = (isLeft ? 1 : -1) * (0.2 + Math.sin(time * 0.8 + phase) * 0.15);
              } else {
                finger.rotation.z = (isLeft ? 1 : -1) * 0.3;
              }
            }
          });

          // Minimal hand movement - subtle fidget
          if (!isWavingRef.current && leftHand) {
            leftHand.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.02;
          }
          
          if (!isWavingRef.current && rightHand) {
            rightHand.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.02;
          }

          // Update hologram position and animation
          if (calorieHologramRef.current && hologramAnchorRef.current) {
            const leftHandBone = vrm.humanoid.getBoneNode('leftHand');
            
            if (leftHandBone && cameraRef.current) {
              // 1. Get hand world position
              const handWorldPos = new THREE.Vector3();
              leftHandBone.getWorldPosition(handWorldPos);
              
              // 2. Calculate camera-facing direction vector
              const cameraPos = cameraRef.current.position.clone();
              const forward = cameraPos.sub(handWorldPos).normalize().multiplyScalar(0.15);
              
              // 3. Compute final world position for hologram (in front of palm)
              const finalPos = handWorldPos.clone().add(forward);
              
              // 4. Convert world position to local coordinates of hand bone
              leftHandBone.worldToLocal(finalPos);
              
              // 5. Set hologram anchor position in local space
              if (hologramAnchorRef.current) {
                hologramAnchorRef.current.position.copy(finalPos);
                
                // 6. Add upward offset (higher to sit above palm, not in wrist)
                hologramAnchorRef.current.position.y += 0.25;
                
                // 7. Shift forward away from body
                hologramAnchorRef.current.position.z += 0.15;
                
                // Shift to the side
                hologramAnchorRef.current.position.x += 0.15;
              }
              
              // Gentle floating animation on hologram itself
              const floatOffset = Math.sin(time * 2) * 0.01;
              const rotationWiggle = Math.sin(time * 1.5) * 0.03;
              calorieHologramRef.current.position.y = floatOffset;
              
              // 7. Make hologram face the camera
              calorieHologramRef.current.lookAt(cameraRef.current.position);
              
              // Add forward tilt for more natural viewing angle (10-20 degrees)
              calorieHologramRef.current.rotation.x -= 0.26;
              
              // Add subtle rotation wiggle for floating effect
              calorieHologramRef.current.rotation.z += rotationWiggle;

              // ANIMATE THE PREMIUM HIGH-TECH ELEMENTS
              calorieHologramRef.current.children.forEach((child: any) => {
                // 1. Rotate HUD arc segments (Iron Man style)
                if (child.userData.isArcGroup && child.children) {
                  child.children.forEach((arc: any) => {
                    if (arc.userData.rotationSpeed) {
                      arc.rotation.z += arc.userData.rotationSpeed * deltaTime;
                    }
                  });
                }
                
                // 2. Pulse ticks with highlight effect
                if (child.userData.animationOffset !== undefined && child.children.length > 0) {
                  child.userData.animationOffset += deltaTime * 1.5;
                  child.children.forEach((tick: any, index: number) => {
                    const pulseIntensity = Math.sin(time * 3 + child.userData.animationOffset + index * 0.8) * 0.5 + 0.5;
                    if (tick.material) {
                      tick.material.opacity = tick.userData.highlight ? 0.7 + pulseIntensity * 0.3 : 0.4 + pulseIntensity * 0.3;
                    }
                  });
                }
                
                // 3. Orbit floating particles with depth variation
                if (child.userData.isParticles && child.children) {
                  child.children.forEach((particle: any) => {
                    const angle = particle.userData.baseAngle + time * particle.userData.orbitSpeed;
                    const radius = 0.05 + Math.sin(time * particle.userData.floatSpeed) * 0.015;
                    particle.position.x = Math.cos(angle) * radius;
                    particle.position.y = Math.sin(angle) * radius;
                    particle.material.opacity = 0.3 + Math.sin(time * 2 + particle.userData.floatSpeed) * 0.3;
                  });
                }
                
                // 4. Pulse inner glow rings
                if (child.userData.isGlow) {
                  const pulse = Math.sin(time * 2 + child.userData.pulseOffset) * 0.5 + 0.5;
                  child.material.opacity = (0.15 - child.userData.pulseOffset * 0.03) * (0.6 + pulse * 0.4);
                }
                
                // 5. Smooth scanning bar with easing
                if (child.userData.isScanBar) {
                  const scanCycle = 3.5;
                  const scanTime = time % scanCycle;
                  const normalizedTime = scanTime / scanCycle;
                  // Smooth easing for scanning motion
                  const eased = normalizedTime < 0.5 
                    ? 2 * normalizedTime * normalizedTime 
                    : 1 - Math.pow(-2 * normalizedTime + 2, 2) / 2;
                  const yPos = (eased - 0.5) * 0.18;
                  child.position.y = yPos;
                  child.material.opacity = 0.5 + Math.sin(normalizedTime * Math.PI) * 0.3;
                }
              });
              
              // Subtle ambient glow pulse
              const outerAura = calorieHologramRef.current.children[0];
              if (outerAura instanceof THREE.Mesh && outerAura.material instanceof THREE.MeshBasicMaterial) {
                const pulseIntensity = 0.08 + Math.sin(time * 1.5) * 0.03;
                outerAura.material.opacity = pulseIntensity;
              }
            }
          }
        }

        // Expressions
        if (vrm.expressionManager) {
          const expressions = vrm.expressionManager;

          if (!expressions._logged) {
            const availableExpressions = Object.keys(expressions.expressionMap || {});
            console.log('✓ VRM expressions available:', availableExpressions);
            expressions._logged = true;
            if (availableExpressions.length === 0) {
              console.warn('⚠️ No blend shape expressions found! Will attempt bone-based blinking.');
            }
          }

          const smileNames = ['happy', 'joy', 'smile', 'relaxed', 'aa', 'ee', 'ih', 'oh', 'ou'];
          for (const name of smileNames) {
            try {
              if (expressions.getValue(name) !== null) {
                expressions.setValue(name, 1.0);
              }
            } catch { /* ignore */ }
          }

          const blinkCycle = time % 3;
          const randomOffset = Math.sin(time * 0.13) * 0.4;
          let eyeValue = 0;

          if (blinkCycle > (2.5 + randomOffset) && blinkCycle < (2.7 + randomOffset)) {
            eyeValue = 1.0;
            if (!expressions._currentlyBlinking) {
              console.log('👁️ BLINK!');
              expressions._currentlyBlinking = true;
            }
          } else {
            expressions._currentlyBlinking = false;
          }

          const blinkNames = ['blink', 'blinkLeft', 'blinkRight', 'blink_l', 'blink_r', 'eyesClosed', 'blinkBoth'];
          let blinkSet = false;
          for (const name of blinkNames) {
            try {
              const currentVal = expressions.getValue(name);
              if (currentVal !== null && currentVal !== undefined) {
                expressions.setValue(name, eyeValue);
                blinkSet = true;
              }
            } catch { /* ignore */ }
          }

          if (!blinkSet && !expressions._warnedNoBlink) {
            console.warn('⚠️ No blink expressions found in VRM');
            expressions._warnedNoBlink = true;
          }
        }

        // Backup bone blink
        if (vrm.humanoid) {
          const blinkCycle = time % 3;
          const randomOffset = Math.sin(time * 0.13) * 0.4;
          const shouldBlink = blinkCycle > (2.5 + randomOffset) && blinkCycle < (2.7 + randomOffset);
          const leftEye = vrm.humanoid.getNormalizedBoneNode('leftEye');
          const rightEye = vrm.humanoid.getNormalizedBoneNode('rightEye');
          if (leftEye || rightEye) {
            const blinkAmount = shouldBlink ? -0.5 : 0;
            if (leftEye) leftEye.rotation.x = blinkAmount;
            if (rightEye) rightEye.rotation.x = blinkAmount;
          }
        }
      }

      if (mixerRef.current) mixerRef.current.update(deltaTime);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) rendererRef.current.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
    };
  }, []);

  return (
    <div className="vrm-container" ref={containerRef} style={{ position: 'relative' }}>
      {/* Speech Bubble - positioned absolutely relative to avatar */}
      <AvatarSpeechBubble myTake={myTake} />
      
      <canvas className="vrm-canvas" ref={canvasRef} />
      {loading && (
        <div className="vrm-loading">
          <p>Loading VRM Avatar...</p>
          <div className="upload-hint">
            <span>Please wait...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="vrm-loading">
          <p>{error}</p>
          <div className="upload-hint">
            <span>Check console for details</span>
          </div>
        </div>
      )}
    </div>
  );
}
