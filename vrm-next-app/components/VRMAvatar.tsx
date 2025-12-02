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
  
  // Helper function to get color based on nutrition score (calories)
  const getNutritionColor = (calories: number): number => {
    // Green for low calories (healthy), red for high calories (unhealthy)
    if (calories < 200) return 0x00ff00; // Bright green - very healthy
    if (calories < 350) return 0x88ff00; // Yellow-green - healthy
    if (calories < 500) return 0xffff00; // Yellow - moderate
    if (calories < 650) return 0xff8800; // Orange - high
    return 0xff0000; // Red - very high
  };
  
  // Helper function to create calorie hologram on left hand
  const createCalorieHologram = (vrm: any, calories: number, foodName: string): THREE.Group => {
    const leftHandBone = vrm.humanoid.getBoneNode('leftHand');
    
    // Remove existing hologram and anchor if any
    if (hologramAnchorRef.current && leftHandBone) {
      leftHandBone.remove(hologramAnchorRef.current);
      hologramAnchorRef.current = null;
      calorieHologramRef.current = null;
    }
    
    if (!leftHandBone) {
      console.warn('Left hand bone not found');
      return new THREE.Group();
    }

    // Create anchor group to isolate hologram from hand bone rotation
    const hologramAnchor = new THREE.Group();
    hologramAnchor.position.set(0, 0, 0); // Will be updated in animation loop
    leftHandBone.add(hologramAnchor);
    hologramAnchorRef.current = hologramAnchor;

    const hologramGroup = new THREE.Group();
    
    // Get color based on nutrition score
    const nutritionColor = getNutritionColor(calories);
    targetColorRef.current.setHex(nutritionColor);
    
    // Create hologram panel (background) - color based on nutrition using MeshStandardMaterial for emissive
    const panelGeometry = new THREE.PlaneGeometry(0.25, 0.15);
    const panelMaterial = new THREE.MeshStandardMaterial({
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
    
    // Create border - matches nutrition color
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({ color: nutritionColor, linewidth: 3 });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    hologramGroup.add(border);
    
    // Create 3D text using canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Get color as CSS string
      const colorString = '#' + nutritionColor.toString(16).padStart(6, '0');
      
      // Draw pulsing circle
      ctx.strokeStyle = colorString;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 90, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw inner ring
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw sci-fi scanlines
      ctx.strokeStyle = colorString + '33';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      
      // Draw small icons (corner brackets)
      ctx.strokeStyle = colorString;
      ctx.lineWidth = 3;
      // Top-left bracket
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 - 70);
      ctx.lineTo(canvas.width / 2 - 110, canvas.height / 2 - 70);
      ctx.lineTo(canvas.width / 2 - 110, canvas.height / 2 - 80);
      ctx.stroke();
      // Top-right bracket
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 + 100, canvas.height / 2 - 70);
      ctx.lineTo(canvas.width / 2 + 110, canvas.height / 2 - 70);
      ctx.lineTo(canvas.width / 2 + 110, canvas.height / 2 - 80);
      ctx.stroke();
      // Bottom-left bracket
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 + 70);
      ctx.lineTo(canvas.width / 2 - 110, canvas.height / 2 + 70);
      ctx.lineTo(canvas.width / 2 - 110, canvas.height / 2 + 80);
      ctx.stroke();
      // Bottom-right bracket
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 + 100, canvas.height / 2 + 70);
      ctx.lineTo(canvas.width / 2 + 110, canvas.height / 2 + 70);
      ctx.lineTo(canvas.width / 2 + 110, canvas.height / 2 + 80);
      ctx.stroke();
      
      // Draw tiny orbiting dots
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = canvas.width / 2 + Math.cos(angle) * 95;
        const y = canvas.height / 2 + Math.sin(angle) * 95;
        ctx.fillStyle = colorString;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw main text
      ctx.fillStyle = colorString;
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${calories}`, canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.font = '40px Arial';
      ctx.fillText('calories', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.14), textMaterial);
    textMesh.position.z = 0.001; // Slightly in front of background
    hologramGroup.add(textMesh);
    
    // Reset rotation and apply stable tilt
    hologramGroup.rotation.set(0, 0, 0);
    hologramGroup.rotation.x = -0.4; // Gentle forward tilt
    hologramGroup.scale.set(1.5, 1.5, 1.5); // Larger for better visibility
    
    // Attach hologram to anchor (not directly to hand bone)
    hologramAnchor.add(hologramGroup);
    console.log(`✓ Calorie hologram created: ${calories} cal for ${foodName}`);
    
    return hologramGroup;
  };
  
  // Update ref when isTyping changes
  useEffect(() => {
    isTypingRef.current = isTyping;
    console.log('✓ isTyping updated:', isTyping);
  }, [isTyping]);

  // Update ref when isWaving changes and start wave animation
  useEffect(() => {
    if (isWaving && !isWavingRef.current) {
      isWavingRef.current = true;
      waveStartTimeRef.current = Date.now();
      console.log('👋 Starting wave animation!');
      
      // Auto-stop waving after 2 seconds
      setTimeout(() => {
        isWavingRef.current = false;
        console.log('👋 Wave animation complete');
      }, 2000);
    }
  }, [isWaving]);

  // Update calorie hologram when calories change
  useEffect(() => {
    if (vrmRef.current && calories !== null && calories > 0) {
      const hologram = createCalorieHologram(vrmRef.current, calories, foodName);
      calorieHologramRef.current = hologram;
      
      // Update color refs for smooth transition
      const getNutritionColor = (cal: number): number => {
        if (cal < 200) return 0x00ff00;
        if (cal < 350) return 0x88ff00;
        if (cal < 500) return 0xffff00;
        if (cal < 650) return 0xff8800;
        return 0xff0000;
      };
      
      const nutritionColor = getNutritionColor(calories);
      
      // Initialize both refs to the new color (hologramColorRef will smoothly transition)
      if (targetColorRef.current) {
        targetColorRef.current.setHex(nutritionColor);
      }
      
      // If this is the first hologram, set current color immediately
      // Otherwise, let the animation loop smoothly transition
      if (!hologramColorRef.current || hologramColorRef.current.getHex() === 0x00ffff) {
        hologramColorRef.current.setHex(nutritionColor);
      }
    } else if (vrmRef.current && calorieHologramRef.current && calories === null) {
      // Remove hologram if calories cleared
      const leftHandBone = vrmRef.current.humanoid.getBoneNode('leftHand');
      if (leftHandBone) {
        leftHandBone.remove(calorieHologramRef.current);
        calorieHologramRef.current = null;
        console.log('✓ Calorie hologram removed');
      }
    }
  }, [calories, foodName]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Create gradient background with tech theme
    const canvas2d = document.createElement('canvas');
    canvas2d.width = 512;
    canvas2d.height = 512;
    const context = canvas2d.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#0a0a1f'); // Deep dark blue
      gradient.addColorStop(0.5, '#1a0033'); // Deep purple
      gradient.addColorStop(1, '#000011'); // Almost black
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);
    }
    
    const texture = new THREE.CanvasTexture(canvas2d);
    scene.background = texture;
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.4, 1.3); // Moved back from 1.1 to 1.3
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      antialias: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.enableRotate = false; // Disable rotation
    controls.enableZoom = false; // Disable zoom
    controls.enablePan = false; // Disable panning
    controlsRef.current = controls;

    // Load VRM
    const loader = new GLTFLoader();
    // @ts-ignore - Type compatibility issue between three-stdlib and @pixiv/three-vrm
    loader.register((parser: any) => {
      return new VRMLoaderPlugin(parser);
    });

    loader.load(
      '/avaturn_avatar.vrm',
      (gltf: any) => {
        try {
          const vrm = gltf.userData.vrm;
          
          if (vrm) {
            // VRM model
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.removeUnnecessaryJoints(gltf.scene);
            
            vrmRef.current = vrm;
            scene.add(vrm.scene);
            
            // Rotate avatar to face front (180 degrees)
            vrm.scene.rotation.y = Math.PI;
            
            // Professional standing pose - arms down at sides
            if (vrm.humanoid) {
              const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
              const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
              const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
              const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
              const leftHandBone = vrm.humanoid.getBoneNode('leftHand');
              const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');
              
              // Left arm - hanging down naturally
              if (leftUpperArm) {
                leftUpperArm.rotation.x = 0.3; // Slight forward
                leftUpperArm.rotation.y = 0.1; // Slight inward
                leftUpperArm.rotation.z = 0.1; // Relaxed position
              }
              if (leftLowerArm) {
                leftLowerArm.rotation.z = -0.1; // Relaxed bend
                leftLowerArm.rotation.x = -0.15; // Slight rotation
              }
              
              // Rotate left hand and finger bases to create palm-up holding pose
              if (leftHandBone) {
                leftHandBone.rotation.x = -0.4; // Rotate hand upward
              }
              
              const leftIndex1 = vrm.humanoid.getBoneNode('leftIndexProximal');
              const leftMiddle1 = vrm.humanoid.getBoneNode('leftMiddleProximal');
              const leftRing1 = vrm.humanoid.getBoneNode('leftRingProximal');
              const leftThumb1 = vrm.humanoid.getBoneNode('leftThumbProximal');
              
              if (leftIndex1) leftIndex1.rotation.x = -0.6; // Curl fingers downward
              if (leftMiddle1) leftMiddle1.rotation.x = -0.6;
              if (leftRing1) leftRing1.rotation.x = -0.6;
              if (leftThumb1) leftThumb1.rotation.x = -0.3; // Thumb slightly less curved
              
              // Right arm - hanging down naturally
              if (rightUpperArm) {
                rightUpperArm.rotation.x = 0.3; // Slight forward
                rightUpperArm.rotation.y = -0.1; // Slight inward
                rightUpperArm.rotation.z = -1.4; // DOWN - negative brings right arm down
              }
              if (rightLowerArm) {
                rightLowerArm.rotation.z = 0.2; // Slight bend
              }
            }
            
            console.log('VRM loaded successfully');
          } else {
            // Regular GLTF model
            scene.add(gltf.scene);
            console.log('GLTF model loaded successfully');
          }

          // Set up animations if available
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
        const percent = (progress.loaded / progress.total * 100).toFixed(2);
        console.log(`Loading progress: ${percent}%`);
      },
      (err: any) => {
        console.error('Error loading VRM:', err);
        setError('Failed to load VRM avatar');
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();
      const time = Date.now() * 0.001; // Convert to seconds

      // Animate VRM
      if (vrmRef.current) {
        // Update VRM first
        vrmRef.current.update(deltaTime);
        
        const vrm = vrmRef.current;
        
        // NATURAL HUMAN IDLE ANIMATIONS
        if (vrm.humanoid) {
          // BREATHING - visible chest and shoulder movement
          const chest = vrm.humanoid.getNormalizedBoneNode('chest') || vrm.humanoid.getNormalizedBoneNode('upperChest');
          const leftShoulder = vrm.humanoid.getNormalizedBoneNode('leftShoulder');
          const rightShoulder = vrm.humanoid.getNormalizedBoneNode('rightShoulder');
          
          const breathCycle = Math.sin(time * 0.4); // ~6 second breath
          const inhale = breathCycle * 0.08;
          
          if (chest) {
            chest.rotation.x = inhale;
            chest.position.z = inhale * 0.03; // Forward/back
          }
          if (leftShoulder) leftShoulder.rotation.x = inhale * 0.5;
          if (rightShoulder) rightShoulder.rotation.x = inhale * 0.5;
          
          // WEIGHT SHIFTING - natural standing sway
          const spine = vrm.humanoid.getNormalizedBoneNode('spine');
          const hips = vrm.humanoid.getNormalizedBoneNode('hips');
          
          const shiftCycle = Math.sin(time * 0.2); // Slow shift every ~5 seconds
          const sway = shiftCycle * 0.08;
          
          if (spine) {
            spine.rotation.y = sway;
            spine.rotation.z = Math.cos(time * 0.25) * 0.04;
          }
          if (hips) {
            hips.rotation.y = sway * 0.6;
            hips.rotation.z = shiftCycle * 0.05;
            hips.position.x = shiftCycle * 0.02; // Visible hip shift
          }
          
          // HEAD MOVEMENT - natural looking around
          const head = vrm.humanoid.getNormalizedBoneNode('head');
          if (head) {
            if (isTypingRef.current) {
              // Look at chatbot when user is typing
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.7, 0.08);
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.05, 0.08);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.05, 0.08);
            } else {
              // Very smoothly return head to neutral forward position when not typing
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.02);
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0, 0.02);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, 0.02);
            }
          }
          
          // ARM MOVEMENT - arms hanging down with subtle sway OR waving
          const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
          const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
          const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
          const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
          const leftHand = vrm.humanoid.getNormalizedBoneNode('leftHand');
          const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');
          
          // WAVE ANIMATION when greeting detected
          if (isWavingRef.current) {
            const waveElapsed = (Date.now() - waveStartTimeRef.current) / 1000; // seconds
            const waveCycle = waveElapsed * 3; // Speed of wave
            
            // Left arm - waving motion
            if (leftUpperArm) {
              // Raise arm up to shoulder height and wave
              leftUpperArm.rotation.z = 0.9 + Math.sin(waveCycle * Math.PI * 2) * 0.2; // Wave side to side
              leftUpperArm.rotation.x = 0.4; // Forward angle
              leftUpperArm.rotation.y = 0.2;
            }
            if (leftLowerArm) {
              // Forearm bends for waving
              leftLowerArm.rotation.z = -2.0 + Math.sin(waveCycle * Math.PI * 2) * 0.3; // Wave motion
              leftLowerArm.rotation.x = -1.57; // -90 degrees to twist forearm
              leftLowerArm.rotation.y = 0;
            }
            if (leftHand) {
              // Palm facing forward (towards camera)
              leftHand.rotation.x = -1.57; // -90 degrees to face palm forward
              leftHand.rotation.y = 0;
              leftHand.rotation.z = 0;
            }
            
            // Right arm stays down
            if (rightUpperArm) {
              rightUpperArm.rotation.z = -1.4;
              rightUpperArm.rotation.x = 0.3;
              rightUpperArm.rotation.y = -0.1;
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.z = 0.2;
            }
            if (rightHand) {
              rightHand.rotation.x = 0.2;
              rightHand.rotation.y = 0;
              rightHand.rotation.z = 0;
            }
          } else {
            // NORMAL IDLE - arms hanging down with subtle sway
            if (leftUpperArm) {
              leftUpperArm.rotation.z = 1.4 + Math.sin(time * 0.3) * 0.03; // DOWN with subtle sway
              leftUpperArm.rotation.x = 0.3 + breathCycle * 0.02; // Breathing sync
              leftUpperArm.rotation.y = 0.1;
            }
            if (rightUpperArm) {
              rightUpperArm.rotation.z = -1.4 + Math.sin(time * 0.35 + 1) * 0.03; // DOWN with subtle sway
              rightUpperArm.rotation.x = 0.3 + breathCycle * 0.02;
              rightUpperArm.rotation.y = -0.1;
            }
            if (leftLowerArm) {
              leftLowerArm.rotation.z = -0.2 + Math.sin(time * 0.4) * 0.02;
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.z = 0.2 + Math.sin(time * 0.45 + 0.5) * 0.02;
            }
          }
          
          // Individual finger movements - applied consistently (not affected by waving)
          const fingers = [
            'leftThumbProximal', 'leftIndexProximal', 'leftMiddleProximal', 'leftRingProximal', 'leftLittleProximal',
            'rightThumbProximal', 'rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal'
          ];
          
          fingers.forEach((fingerName, index) => {
            const finger = vrm.humanoid.getNormalizedBoneNode(fingerName);
            if (finger) {
              const phase = index * 0.5;
              const isLeft = fingerName.startsWith('left');
              
              // Special handling for thumbs to keep them closer to hand
              if (fingerName.includes('Thumb')) {
                finger.rotation.z = (isLeft ? 1 : -1) * 0.3; // Keep thumb closer
                finger.rotation.x = 0; // Neutral position
                finger.rotation.y = (isLeft ? 1 : -1) * 0.2; // Slight inward rotation
              } else {
                // Other fingers with subtle movement (only when not waving)
                if (!isWavingRef.current) {
                  finger.rotation.z = (isLeft ? 1 : -1) * (0.2 + Math.sin(time * 0.8 + phase) * 0.15);
                } else {
                  // Keep fingers slightly curved when waving
                  finger.rotation.z = (isLeft ? 1 : -1) * 0.3;
                }
              }
            }
          });
          
          // HAND AND FINGER MOVEMENTS - natural fidgeting (only when NOT waving)
          if (!isWavingRef.current) {
            if (leftHand) {
              leftHand.rotation.x = 0.2 + Math.sin(time * 0.6) * 0.08;
              leftHand.rotation.y = Math.sin(time * 0.5) * 0.05;
              leftHand.rotation.z = Math.cos(time * 0.7) * 0.06;
            }
            if (rightHand) {
              rightHand.rotation.x = 0.2 + Math.sin(time * 0.65 + 1) * 0.08;
              rightHand.rotation.y = Math.sin(time * 0.55 + 0.5) * 0.05;
              rightHand.rotation.z = Math.cos(time * 0.75 + 1) * 0.06;
            }
          }
        }
        
        // FACIAL EXPRESSIONS
        if (vrm.expressionManager) {
          const expressions = vrm.expressionManager;
          
          // Log available expressions once
          if (!expressions._logged) {
            const availableExpressions = Object.keys(expressions.expressionMap || {});
            console.log('✓ VRM expressions available:', availableExpressions);
            expressions._logged = true;
            
            // If no expressions, we'll use bone animation instead
            if (availableExpressions.length === 0) {
              console.warn('⚠️ No blend shape expressions found! Will attempt bone-based blinking.');
            }
          }
          
          // BIG SMILE - try all possible smile expressions
          const smileNames = ['happy', 'joy', 'smile', 'relaxed', 'aa', 'ee', 'ih', 'oh', 'ou'];
          for (const name of smileNames) {
            try {
              if (expressions.getValue(name) !== null) {
                expressions.setValue(name, 1.0);
              }
            } catch (e) {
              // Expression doesn't exist, skip
            }
          }
          
          // BLINKING - Every 2-4 seconds (more natural frequency)
          const blinkCycle = time % 3; // 3 second base cycle for more frequent blinks
          const randomOffset = Math.sin(time * 0.13) * 0.4; // Add variation
          let eyeValue = 0;
          
          // Blink for 0.2 seconds at random intervals
          if (blinkCycle > (2.5 + randomOffset) && blinkCycle < (2.7 + randomOffset)) {
            eyeValue = 1.0;
            if (!expressions._currentlyBlinking) {
              console.log('👁️ BLINK!');
              expressions._currentlyBlinking = true;
            }
          } else {
            expressions._currentlyBlinking = false;
          }
          
          // Try to set blink on all possible eye expressions
          const blinkNames = ['blink', 'blinkLeft', 'blinkRight', 'blink_l', 'blink_r', 'eyesClosed', 'blinkBoth'];
          let blinkSet = false;
          for (const name of blinkNames) {
            try {
              const currentVal = expressions.getValue(name);
              if (currentVal !== null && currentVal !== undefined) {
                expressions.setValue(name, eyeValue);
                blinkSet = true;
              }
            } catch (e) {
              // Expression doesn't exist
            }
          }
          
          if (!blinkSet && !expressions._warnedNoBlink) {
            console.warn('⚠️ No blink expressions found in VRM');
            expressions._warnedNoBlink = true;
          }
        }
        
        // ALTERNATIVE: Try bone-based blinking if blend shapes don't work
        if (vrm.humanoid) {
          // Randomized blink timing (2-4 seconds) - more frequent
          const blinkCycle = time % 3;
          const randomOffset = Math.sin(time * 0.13) * 0.4;
          const shouldBlink = blinkCycle > (2.5 + randomOffset) && blinkCycle < (2.7 + randomOffset);
          
          // Try to find and animate eyelid bones
          const leftEye = vrm.humanoid.getNormalizedBoneNode('leftEye');
          const rightEye = vrm.humanoid.getNormalizedBoneNode('rightEye');
          
          if (leftEye || rightEye) {
            const blinkAmount = shouldBlink ? -0.5 : 0; // Increased blink amount for visibility
            if (leftEye) leftEye.rotation.x = blinkAmount;
            if (rightEye) rightEye.rotation.x = blinkAmount;
            
            if (shouldBlink && !vrm._boneBlink) {
              console.log('👁️ Bone-based BLINK');
              vrm._boneBlink = true;
            } else if (!shouldBlink) {
              vrm._boneBlink = false;
            }
          }
        }
      }

      // Update mixer for animations
      if (mixerRef.current) {
        mixerRef.current.update(deltaTime);
      }

      // Update VRM
      if (vrmRef.current) {
        vrmRef.current.update(deltaTime);
      }

      // Animate calorie hologram - position IN FRONT of palm using world coordinates
      if (calorieHologramRef.current && cameraRef.current && vrmRef.current) {
        const leftHandBone = vrmRef.current.humanoid.getBoneNode('leftHand');
        
        if (leftHandBone) {
          // 1. Get world position of hand bone
          const handWorldPos = new THREE.Vector3();
          leftHandBone.getWorldPosition(handWorldPos);
          
          // 2. Get camera-facing direction (from hand toward camera)
          const forward = new THREE.Vector3();
          forward.subVectors(cameraRef.current.position, handWorldPos).normalize().multiplyScalar(0.15);
          
          // 3. Compute final world position for hologram (in front of palm)
          const finalPos = handWorldPos.clone().add(forward);
          
          // 4. Convert world position to local coordinates of hand bone
          leftHandBone.worldToLocal(finalPos);
          
          // 5. Set hologram anchor position in local space
          if (hologramAnchorRef.current) {
            hologramAnchorRef.current.position.copy(finalPos);
            
            // 6. Add upward offset (higher to sit above palm, not in wrist)
            hologramAnchorRef.current.position.y += 0.18;
          }
          
          // Gentle floating animation on hologram itself
          const floatOffset = Math.sin(time * 2) * 0.01;
          const rotationWiggle = Math.sin(time * 1.5) * 0.03; // Small rotation wiggle
          calorieHologramRef.current.position.y = floatOffset;
          
          // 7. Make hologram face the camera
          calorieHologramRef.current.lookAt(cameraRef.current.position);
          
          // Add forward tilt for more natural viewing angle (10-20 degrees)
          calorieHologramRef.current.rotation.x -= 0.26; // ~15 degrees forward tilt
          
          // Add subtle rotation wiggle for floating effect
          calorieHologramRef.current.rotation.z += rotationWiggle;
          
          // Smooth color transition animation
          if (hologramColorRef.current && targetColorRef.current) {
            hologramColorRef.current.lerp(targetColorRef.current, 0.05);
            
            const panel = calorieHologramRef.current.children[0];
            const border = calorieHologramRef.current.children[1];
            
            if (panel instanceof THREE.Mesh && panel.material instanceof THREE.MeshStandardMaterial) {
              panel.material.color.copy(hologramColorRef.current);
              
              if (panel.material.emissive) {
                panel.material.emissive.copy(hologramColorRef.current);
              }
              
              // Subtle glow pulse on background panel
              const pulseIntensity = 0.3 + Math.sin(time * 3) * 0.05;
              panel.material.opacity = pulseIntensity;
            }
            
            if (border instanceof THREE.Mesh && border.material instanceof THREE.MeshBasicMaterial) {
              border.material.color.copy(hologramColorRef.current);
            }
          }
        }
      }

      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
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
