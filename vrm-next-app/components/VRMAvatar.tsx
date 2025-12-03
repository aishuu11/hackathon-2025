'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// @ts-ignore - Type mismatch between three-stdlib and @types/three
import { GLTFLoader } from 'three-stdlib';
// @ts-ignore - Type mismatch between three-stdlib and @types/three
import { OrbitControls } from 'three-stdlib';

interface VRMAvatarProps {
  isTyping?: boolean;
  isWaving?: boolean;
  calories?: number | null;
  foodName?: string;
}

export default function VRMAvatar({ isTyping = false, isWaving = false, calories = null, foodName = '' }: VRMAvatarProps) {
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

  const createCalorieHologram = (vrm: any, calories: number, foodName: string): THREE.Group => {
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

    const nutritionColor = getNutritionColor(calories);
    targetColorRef.current.setHex(nutritionColor);
    
    const panelGeometry = new THREE.CircleGeometry(0.15, 32);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: nutritionColor,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      emissive: nutritionColor,
      emissiveIntensity: 0.5
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    hologramGroup.add(panel);

    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({ color: nutritionColor, linewidth: 3 });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    hologramGroup.add(border);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const colorString = '#' + nutritionColor.toString(16).padStart(6, '0');
      
      ctx.strokeStyle = colorString;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
      ctx.stroke();
      
      const pulseRadius = 90 + Math.sin(Date.now() * 0.003) * 5;
      ctx.strokeStyle = colorString + '88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = colorString;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      
      for (let y = -100; y <= 100; y += 8) {
        ctx.fillStyle = colorString + '33';
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + y, 200, 2);
      }
      
      const corners = [
        [canvas.width / 2 - 95, canvas.height / 2 - 95],
        [canvas.width / 2 + 95, canvas.height / 2 - 95],
        [canvas.width / 2 - 95, canvas.height / 2 + 95],
        [canvas.width / 2 + 95, canvas.height / 2 + 95]
      ];
      
      ctx.strokeStyle = colorString;
      ctx.lineWidth = 3;
      corners.forEach(([x, y]) => {
        const size = 15;
        const isRight = x > canvas.width / 2;
        const isBottom = y > canvas.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + (isRight ? -size : size), y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + (isBottom ? -size : size));
        ctx.stroke();
      });
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = canvas.width / 2 + Math.cos(angle) * 95;
        const y = canvas.height / 2 + Math.sin(angle) * 95;
        ctx.fillStyle = colorString;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = colorString;
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${calories}`, canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.fillStyle = colorString + 'cc';
      ctx.font = '24px Arial';
      ctx.fillText('CALORIES', canvas.width / 2, canvas.height / 2 + 30);
      
      ctx.font = '18px Arial';
      ctx.fillStyle = colorString + '99';
      const maxWidth = 180;
      const truncatedName = foodName.length > 20 ? foodName.substring(0, 20) + '...' : foodName;
      ctx.fillText(truncatedName, canvas.width / 2, canvas.height / 2 + 60);
    }
    
    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.needsUpdate = true;
    const textMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const textMesh = new THREE.Mesh(new THREE.CircleGeometry(0.14, 32), textMaterial);
    textMesh.position.z = 0.001;
    hologramGroup.add(textMesh);
    
    hologramGroup.rotation.set(0, 0, 0);
    hologramGroup.rotation.x = -0.4;
    hologramGroup.scale.set(1.5, 1.5, 1.5);
    
    hologramAnchor.add(hologramGroup);
    console.log(`✓ Calorie hologram created: ${calories} cal for ${foodName}`);
    
    return hologramGroup;
  };

  useEffect(() => {
    if (vrmRef.current && calories !== null && calories > 0) {
      console.log(`🔮 Creating hologram for ${calories} calories of ${foodName}`);
      
      // Remove existing hologram if any
      if (calorieHologramRef.current && hologramAnchorRef.current) {
        const leftHandBone = vrmRef.current.humanoid.getBoneNode('leftHand');
        if (leftHandBone && hologramAnchorRef.current.parent === leftHandBone) {
          leftHandBone.remove(hologramAnchorRef.current);
          console.log('✓ Removed old hologram');
        }
      }
      
      const hologram = createCalorieHologram(vrmRef.current, calories, foodName);
      calorieHologramRef.current = hologram;
      
      const nutritionColor = getNutritionColor(calories);
      targetColorRef.current.setHex(nutritionColor);
      
      if (!hologramColorRef.current || hologramColorRef.current.getHex() === 0x00ffff) {
        hologramColorRef.current.setHex(nutritionColor);
      }
      
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
  }, [calories, foodName]);

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

            // Left arm - relaxed pose for holding hologram
            if (leftShoulder) {
              leftShoulder.rotation.set(inhale * 0.5, 0, 0);
            }
            if (leftUpperArm) {
              leftUpperArm.rotation.z = 0.1;
              leftUpperArm.rotation.x = 0.3 + breathCycle * 0.02;
              leftUpperArm.rotation.y = 0.1;
            }
            if (leftLowerArm) {
              leftLowerArm.rotation.z = -0.1;
              leftLowerArm.rotation.x = -0.15;
              leftLowerArm.rotation.y = 0;
            }
            if (leftHand) {
              leftHand.rotation.x = -0.3;
              leftHand.rotation.y = 0.1;
              leftHand.rotation.z = 0.2;
            }
            
            // Left hand fingers for palm-up pose
            const leftThumb = vrm.humanoid.getBoneNode('leftThumbProximal');
            const leftIndex = vrm.humanoid.getBoneNode('leftIndexProximal');
            const leftMiddle = vrm.humanoid.getBoneNode('leftMiddleProximal');
            const leftRing = vrm.humanoid.getBoneNode('leftRingProximal');
            
            if (leftThumb) leftThumb.rotation.x = -0.3;
            if (leftIndex) leftIndex.rotation.x = -0.6;
            if (leftMiddle) leftMiddle.rotation.x = -0.6;
            if (leftRing) leftRing.rotation.x = -0.6;
            
            // *** RIGHT ARM: "hi" pose ***
            if (rightShoulder) {
              rightShoulder.rotation.set(0.05, 0.05, 0);
            }
            if (rightUpperArm) {
              // arm slightly forward and not fully sideways
              rightUpperArm.rotation.set(-0.35, 0.35, -0.15);
            }
            if (rightLowerArm) {
              // elbow bent so forearm comes up
              rightLowerArm.rotation.set(-1.1, 0.05, 0.1);
            }
            if (rightHand) {
              // palm generally facing camera but tilted inward, fingers relaxed
              rightHand.rotation.set(
                0.25,                    // slight upward tilt
                -Math.PI / 2 + 0.35,     // face towards camera, slight inward
                0.15                     // small sideways tilt
              );
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

          // Left hand fidget only (right hand stays hi)
          if (!isWavingRef.current && leftHand && !calorieHologramRef.current) {
            leftHand.rotation.x = 0.2 + Math.sin(time * 0.6) * 0.08;
            leftHand.rotation.y = Math.sin(time * 0.5) * 0.05;
            leftHand.rotation.z = Math.cos(time * 0.7) * 0.06;
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
                hologramAnchorRef.current.position.y += 0.18;
                
                // 7. Shift toward thumb for gripping pose
                hologramAnchorRef.current.position.x += 0.05;
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
              
              // Smooth color transition animation
              if (hologramColorRef.current && targetColorRef.current) {
                const currentColor = hologramColorRef.current;
                currentColor.lerp(targetColorRef.current, 0.05);
                
                const panel = calorieHologramRef.current.children[0];
                const border = calorieHologramRef.current.children[1];
                
                if (panel instanceof THREE.Mesh && panel.material instanceof THREE.MeshBasicMaterial) {
                  panel.material.color.copy(currentColor);
                  
                  if (panel.material.emissive) {
                    panel.material.emissive.copy(currentColor);
                  }
                  
                  // Subtle glow pulse on background panel
                  const pulseIntensity = 0.3 + Math.sin(time * 3) * 0.05;
                  panel.material.opacity = pulseIntensity;
                }
                
                if (border instanceof THREE.Mesh && border.material instanceof THREE.MeshBasicMaterial) {
                  border.material.color.copy(currentColor);
                }
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
    <div className="vrm-container" ref={containerRef}>
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
