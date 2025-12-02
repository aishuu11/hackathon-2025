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
}

export default function VRMAvatar({ isTyping = false, isWaving = false }: VRMAvatarProps) {
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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = null;
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

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

    // Fake ground shadow
    const shadowGeometry = new THREE.PlaneGeometry(1.5, 0.8);
    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 256;
    gradientCanvas.height = 128;
    const ctx = gradientCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 64, 0, 128, 64, 128);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(0.5, '#0d001a');
    gradient.addColorStop(1, 'rgba(0, 10, 30, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 128);
    const shadowTexture = new THREE.CanvasTexture(gradientCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.6,
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

            // Left arm normal
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
          if (!isWavingRef.current && leftHand) {
            leftHand.rotation.x = 0.2 + Math.sin(time * 0.6) * 0.08;
            leftHand.rotation.y = Math.sin(time * 0.5) * 0.05;
            leftHand.rotation.z = Math.cos(time * 0.7) * 0.06;
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
