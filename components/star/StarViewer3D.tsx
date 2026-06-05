'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GLBModelViewer from './GLBModelViewer';

// Map planet names → GLB paths + viewer config.
// Add more entries here as you download more models.
const PLANET_GLB_CONFIG: Record<string, {
  path: string;
  atmosphereColor: string;
  showAtmosphere?: boolean;
  rotationSpeed?: number;
  modelScale?: number;
  cameraZ?: number;
}> = {
  earth:   { path: '/models/earth.glb', atmosphereColor: '#3a8fff', showAtmosphere: false, rotationSpeed: 0.12, modelScale: 1.8, cameraZ: 5 },
  mars:    { path: '/models/mars.glb',    atmosphereColor: '#cc4422', rotationSpeed: 0.10, modelScale: 1.8, cameraZ: 5 },
  saturn:  { path: '/models/saturn.glb',  atmosphereColor: '#d4b070', rotationSpeed: 0.08, modelScale: 2.0, cameraZ: 6 },
  jupiter: { path: '/models/jupiter.glb', atmosphereColor: '#d4906a', rotationSpeed: 0.20, modelScale: 2.0, cameraZ: 6 },
  moon:    { path: '/models/moon.glb',    atmosphereColor: '#888888', showAtmosphere: false, rotationSpeed: 0.05, modelScale: 1.6, cameraZ: 5 },
  sun:     { path: '/models/sun.glb',     atmosphereColor: '#ffaa00', rotationSpeed: 0.05, modelScale: 2.0, cameraZ: 6 },
  venus:   { path: '/models/venus.glb',   atmosphereColor: '#e3bb76', rotationSpeed: 0.06, modelScale: 1.8, cameraZ: 5 },
  mercury: { path: '/models/mercury.glb', atmosphereColor: '#999999', showAtmosphere: false, rotationSpeed: 0.04, modelScale: 1.5, cameraZ: 5 },
  uranus:  { path: '/models/uranus.glb',  atmosphereColor: '#7de8e8', rotationSpeed: 0.10, modelScale: 1.8, cameraZ: 5 },
  neptune: { path: '/models/neptune.glb', atmosphereColor: '#4455dd', rotationSpeed: 0.12, modelScale: 1.8, cameraZ: 5 },
  'solar system': { path: '/models/solar_system_animation.glb', atmosphereColor: '#ffffff', showAtmosphere: false, rotationSpeed: 0.05, modelScale: 4.5, cameraZ: 5.5 },
};

interface StarViewer3DProps {
  spectralClass?: string;
  starType?: string;
  name?: string;
  fullScreen?: boolean;
}

export default function StarViewer3D({ spectralClass, starType, name = '', fullScreen = false }: StarViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const isPlanetType = starType === 'Planet' || starType === 'Dwarf Planet';
  // Check if we have a model for this celestial body by matching its name against our config keys
  const planetKey = Object.keys(PLANET_GLB_CONFIG).find((key) => name.toLowerCase().includes(key));
  const glbConfig = planetKey ? PLANET_GLB_CONFIG[planetKey] : undefined;

  // ── If a real GLB model exists for this body, render it instead ──────────
  if (glbConfig) {
    return (
      <GLBModelViewer
        modelPath={glbConfig.path}
        planetName={name}
        atmosphereColor={glbConfig.atmosphereColor}
        showAtmosphere={!!glbConfig.showAtmosphere}
        rotationSpeed={glbConfig.rotationSpeed}
        modelScale={glbConfig.modelScale}
        cameraZ={glbConfig.cameraZ}
        enableZoom={!fullScreen}
      />
    );
  }

  // ── Fallback: shader-based renderer for stars and bodies without a model ──
  useEffect(() => {
    if (!mountRef.current) return;

    // Determine colors
    const isPlanet = starType === 'Planet' || starType === 'Dwarf Planet';
    const cls = spectralClass ? spectralClass[0].toUpperCase() : 'G';
    const planetName = name.toLowerCase();

    let coreColor = 0xFFD700;
    let glowColor = 0xFFA500;
    let isEarth = false;
    let isSaturn = false;
    let uNoiseScale = 2.0;
    let uSpeed = 0.15;
    let uTurbulence = 0.5;

    if (isPlanet) {
      if (planetName.includes('mars')) { coreColor = 0xC1440E; glowColor = 0x8B3A3A; }
      else if (planetName.includes('jupiter')) { coreColor = 0xd39c7e; glowColor = 0xe0c9a6; }
      else if (planetName.includes('earth')) { coreColor = 0x1E90FF; glowColor = 0x228B22; isEarth = true; }
      else if (planetName.includes('mercury')) { coreColor = 0xaaaaaa; glowColor = 0x888888; }
      else if (planetName.includes('venus')) { coreColor = 0xe3bb76; glowColor = 0xc9a05b; }
      else if (planetName.includes('moon')) { coreColor = 0x999999; glowColor = 0x555555; }
      else if (planetName.includes('saturn')) { coreColor = 0xe3cdb2; glowColor = 0xd4b499; isSaturn = true; }
      else if (planetName.includes('uranus')) { coreColor = 0xadd8e6; glowColor = 0x87ceeb; }
      else if (planetName.includes('neptune')) { coreColor = 0x4b70dd; glowColor = 0x3a57b5; }
      else if (planetName.includes('pluto')) { coreColor = 0xddc4b0; glowColor = 0x9c8978; }
      else { coreColor = 0x999999; glowColor = 0x333333; }
    } else {
      switch (cls) {
        case 'O': coreColor = 0x9BB0FF; glowColor = 0x6496FF; uNoiseScale = 5.0; uSpeed = 0.4; uTurbulence = 0.8; break;
        case 'B': coreColor = 0xAABFFF; glowColor = 0x78AAFF; uNoiseScale = 4.0; uSpeed = 0.3; uTurbulence = 0.7; break;
        case 'A': coreColor = 0xFFFFFF; glowColor = 0xFFFFFF; uNoiseScale = 3.0; uSpeed = 0.2; uTurbulence = 0.6; break;
        case 'F': coreColor = 0xFFF4EA; glowColor = 0xFFF0C8; uNoiseScale = 2.5; uSpeed = 0.15; uTurbulence = 0.5; break;
        case 'G': coreColor = 0xFFD700; glowColor = 0xFFA500; uNoiseScale = 2.0; uSpeed = 0.1; uTurbulence = 0.4; break;
        case 'K': coreColor = 0xFF8C42; glowColor = 0xFF6432; uNoiseScale = 1.5; uSpeed = 0.08; uTurbulence = 0.3; break;
        case 'M': coreColor = 0xFF4500; glowColor = 0xFF0000; uNoiseScale = 1.0; uSpeed = 0.05; uTurbulence = 0.2; break;
        default: coreColor = 0xFFD700; glowColor = 0xFFA500; uNoiseScale = 2.0; uSpeed = 0.1; uTurbulence = 0.4; break;
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isPlanet ? 1.2 : 1.5;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.touchAction = 'none'; // Force no-scroll over the canvas
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 15;

    // Core Sphere
    const geometry = new THREE.SphereGeometry(1.5, 128, 128); // Higher poly for better rim lighting
    
    // --- SHADERS FOR REALISTIC STARS ---
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uNoiseScale;
      uniform float uSpeed;
      uniform float uTurbulence;
      varying vec3 vNormal;
      varying vec3 vPosition;

      // Ashima 3D Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute( permute( permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }

      float fbm(vec3 p) {
        float f = 0.0;
        float amp = 0.5;
        for(int i=0; i<4; i++){
          f += amp * snoise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec3 p = vPosition * uNoiseScale + vec3(0.0, uTime * uSpeed, uTime * (uSpeed * 0.8));
        
        // Smooth rolling noise instead of sharp cellular cracks
        float n = fbm(p);
        
        // Add turbulence for more active stars
        if (uTurbulence > 0.0) {
            n += snoise(p * 2.0 - vec3(uTime * uSpeed * 2.0)) * uTurbulence * 0.5;
        }

        // Remap to 0-1 range
        n = n * 0.5 + 0.5;

        // Spots are darker, smoother areas
        float spots = smoothstep(0.4, 0.8, fbm(vPosition * (uNoiseScale * 0.5) + vec3(uTime * (uSpeed * 0.2))));
        
        vec3 baseColor = uColor;
        vec3 hotColor = min(uColor * 2.5 + vec3(0.5), vec3(1.0));
        vec3 darkColor = uColor * 0.15;
        
        // Soft mix for boiling plasma
        vec3 color = mix(darkColor, hotColor, smoothstep(0.2, 0.8, n));
        
        // Apply dark spots
        color = mix(color, darkColor * 0.3, spots * 0.8);
        
        // Large scale waves
        float waves = snoise(vPosition * 1.5 - vec3(uTime * uSpeed * 0.5));
        color += hotColor * smoothstep(0.2, 1.0, waves) * 0.4;

        vec3 viewDir = normalize(cameraPosition - vPosition);
        float intensity = max(dot(vNormal, viewDir), 0.0);
        
        // Limb darkening/brightening
        float rim = pow(1.0 - intensity, 3.0);
        color += hotColor * rim * 0.5; 
        color *= mix(0.6, 1.2, pow(intensity, 0.6));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const coronaVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
      }
    `;

    const coronaFragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uSpeed;
      varying vec3 vNormal;
      varying vec3 vPosition;

      // Ashima 3D Noise (reused for corona)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }

      float fbm(vec3 p) {
        float f = 0.0;
        float amp = 0.5;
        for(int i=0; i<3; i++){
          f += amp * snoise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float intensity = max(dot(vNormal, viewDir), 0.0);
        
        // Soft glowing falloff towards the edge (so it doesn't look like a hard ring)
        // fade out completely near the extreme edge of the sphere (intensity < 0.1)
        float edgeFade = smoothstep(0.0, 0.2, intensity);
        
        // Intense closer to the center, softer outwards
        float rim = pow(1.0 - intensity, 2.5) * edgeFade;
        
        // Solar flares
        vec3 p = vPosition * 3.0 - vec3(0.0, uTime * uSpeed * 2.0, 0.0);
        float flares = fbm(p);
        flares = pow(flares * 0.5 + 0.5, 3.0) * 1.5;
        
        float alpha = rim * 0.5 + flares * rim * 0.6;
        
        gl_FragColor = vec4(uColor * 1.5, alpha);
      }
    `;

    const planetFragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uColor2;
      uniform int uPlanetType;
      varying vec3 vNormal;
      varying vec3 vPosition;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + .1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }
      float fbm(vec3 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p = p * 2.02;
        f += 0.2500 * noise(p); p = p * 2.03;
        f += 0.1250 * noise(p); p = p * 2.01;
        f += 0.0625 * noise(p);
        return f;
      }

      void main() {
        float n = 0.0;
        vec3 color = uColor;
        float roughness = 0.8;
        float specularIntensity = 0.2;
        
        if (uPlanetType == 2) {
            // Jupiter
            vec3 p = vPosition * vec3(1.5, 5.0, 1.5);
            n = fbm(p + vec3(uTime * 0.02, 0.0, uTime * 0.02));
            float band = sin(vPosition.y * 12.0 + n * 2.5);
            color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band));
            float storm = fbm(vPosition * 4.0 - vec3(uTime * 0.05));
            color = mix(color, vec3(0.8, 0.5, 0.3), smoothstep(0.7, 1.0, storm) * 0.5);
            specularIntensity = 0.1;
        } else if (uPlanetType == 3) {
            // Earth
            n = fbm(vPosition * 3.0);
            if (n < 0.45) { 
              color = uColor; // Ocean
              specularIntensity = 0.8; 
              roughness = 0.2;
            } else { 
              color = mix(uColor2, vec3(0.8, 0.7, 0.5), smoothstep(0.45, 0.7, n)); // Land
              specularIntensity = 0.1;
              roughness = 0.9;
            }
            float clouds = fbm(vPosition * 4.0 + vec3(uTime * 0.01));
            if (clouds > 0.55) { 
              color = mix(color, vec3(1.0), (clouds - 0.55) * 2.5); 
              specularIntensity = 0.05;
            }
        } else if (uPlanetType == 1) {
            // Mars
            n = fbm(vPosition * 3.0);
            color = mix(uColor, uColor2, n);
            float craters = fbm(vPosition * 8.0);
            color *= mix(0.6, 1.0, smoothstep(0.3, 0.6, craters));
            specularIntensity = 0.05;
        } else if (uPlanetType == 4) {
            // Mercury
            n = fbm(vPosition * 10.0);
            float craters = fbm(vPosition * 20.0);
            color = mix(uColor, uColor2, n);
            color *= mix(0.4, 1.0, smoothstep(0.2, 0.8, craters));
            specularIntensity = 0.1;
        } else if (uPlanetType == 5) {
            // Venus
            vec3 p = vPosition * vec3(2.0, 4.0, 2.0);
            n = fbm(p + vec3(uTime * 0.015, 0.0, -uTime * 0.01));
            float band = sin(vPosition.y * 8.0 + n * 3.0);
            color = mix(uColor, uColor2, smoothstep(-0.4, 0.4, band));
            specularIntensity = 0.05;
        } else if (uPlanetType == 6) {
            // Moon
            n = fbm(vPosition * 2.0);
            float craters = fbm(vPosition * 15.0);
            color = mix(uColor, uColor2, smoothstep(0.3, 0.7, n));
            color *= mix(0.5, 1.0, smoothstep(0.4, 0.6, craters));
            specularIntensity = 0.02;
        } else if (uPlanetType == 7) {
            // Saturn
            vec3 p = vPosition * vec3(1.0, 6.0, 1.0);
            n = fbm(p + vec3(0.0, uTime * 0.005, 0.0));
            float band = sin(vPosition.y * 15.0 + n * 0.5);
            color = mix(uColor, uColor2, smoothstep(-0.8, 0.8, band));
            specularIntensity = 0.15;
        } else if (uPlanetType == 8) {
            // Uranus
            n = fbm(vPosition * vec3(1.0, 8.0, 1.0));
            color = mix(uColor, uColor2, n * 0.2); 
            specularIntensity = 0.2;
        } else if (uPlanetType == 9) {
            // Neptune
            vec3 p = vPosition * vec3(1.5, 4.0, 1.5);
            n = fbm(p + vec3(uTime * 0.04, 0.0, 0.0));
            float band = sin(vPosition.y * 10.0 + n);
            color = mix(uColor, uColor2, smoothstep(-0.5, 0.5, band));
            float storm = fbm(vPosition * 5.0 - vec3(uTime * 0.08));
            if (storm > 0.65) { color = mix(color, vec3(1.0), (storm - 0.65) * 3.0); }
            specularIntensity = 0.2;
        } else if (uPlanetType == 10) {
            // Pluto
            n = fbm(vPosition * 3.5);
            color = mix(uColor, uColor2, smoothstep(0.3, 0.6, n));
            specularIntensity = 0.1;
        } else {
            // Generic planet
            n = fbm(vPosition * 3.0 + vec3(uTime * 0.01));
            color = mix(uColor, uColor2, n);
            specularIntensity = 0.1;
        }
        
        // Realistic Lighting Calculation
        vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0)); // Directional light from top right
        vec3 viewDir = normalize(cameraPosition - vPosition);
        vec3 halfVector = normalize(lightDir + viewDir);
        
        // Diffuse
        float diff = max(dot(vNormal, lightDir), 0.0);
        
        // Specular (Blinn-Phong)
        float spec = pow(max(dot(vNormal, halfVector), 0.0), 128.0 * (1.0 - roughness)) * specularIntensity;
        
        // Rim Light (Atmosphere scattering)
        float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
        rim = smoothstep(0.5, 1.0, rim);
        vec3 rimColor = mix(uColor2, vec3(1.0), 0.5);
        
        // Ambient Light (Simulating starlight/galaxy background)
        vec3 ambient = vec3(0.02, 0.02, 0.05);
        
        // Combine lighting
        vec3 finalColor = color * diff + ambient;
        finalColor += vec3(1.0) * spec * diff; // Specular only on lit side
        
        // Add glowing rim only if there's an atmosphere (rough heuristic)
        if (uPlanetType != 6 && uPlanetType != 4 && uPlanetType != 10) {
          finalColor += rimColor * rim * diff * 0.8;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(coreColor) },
      uNoiseScale: { value: 2.0 },
      uSpeed: { value: 0.15 },
      uTurbulence: { value: 0.5 }
    };

    if (!isPlanet) {
      // Set the dynamic star uniforms
      uniforms.uNoiseScale.value = uNoiseScale;
      uniforms.uSpeed.value = uSpeed;
      uniforms.uTurbulence.value = uTurbulence;
    }

    let material;
    if (isPlanet) {
      let pType = 0;
      let color2 = glowColor;
      
      if (planetName.includes('mars')) pType = 1;
      else if (planetName.includes('jupiter')) pType = 2;
      else if (planetName.includes('earth')) pType = 3;
      else if (planetName.includes('mercury')) pType = 4;
      else if (planetName.includes('venus')) pType = 5;
      else if (planetName.includes('moon')) pType = 6;
      else if (planetName.includes('saturn')) pType = 7;
      else if (planetName.includes('uranus')) pType = 8;
      else if (planetName.includes('neptune')) pType = 9;
      else if (planetName.includes('pluto')) pType = 10;
      
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: planetFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(coreColor) },
          uColor2: { value: new THREE.Color(color2) },
          uPlanetType: { value: pType }
        }
      });
      uniforms.uTime = material.uniforms.uTime;
    } else {
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms
      });
    }
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    let coronaMesh: THREE.Mesh | null = null;
    if (!isPlanet) {
      const coronaGeo = new THREE.SphereGeometry(1.65, 64, 64);
      const coronaMat = new THREE.ShaderMaterial({
        vertexShader: coronaVertexShader,
        fragmentShader: coronaFragmentShader,
        uniforms: uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
      });
      coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      scene.add(coronaMesh);
    }

    // Saturn rings
    if (isSaturn) {
      const ringGeometry = new THREE.RingGeometry(1.8, 3.2, 128);
      
      // Simple custom shader for realistic ring scattering
      const ringVertex = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
        }
      `;
      const ringFragment = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          // Create gaps in the rings
          float alpha = smoothstep(0.4, 0.45, dist) * smoothstep(0.5, 0.48, dist);
          alpha += smoothstep(0.25, 0.28, dist) * smoothstep(0.38, 0.35, dist) * 0.8;
          
          vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float scatter = max(dot(viewDir, lightDir), 0.0);
          
          vec3 ringColor = vec3(0.83, 0.7, 0.6);
          // Forward scattering makes rings brighter when looking toward the light
          vec3 finalColor = ringColor * (0.4 + pow(scatter, 4.0) * 0.6);
          
          gl_FragColor = vec4(finalColor, alpha * 0.85);
        }
      `;
      
      const ringMaterial = new THREE.ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 - 0.2;
      scene.add(ring);
    }

    const currentMount = mountRef.current;

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Using performance.now() to avoid THREE.Clock deprecation warnings/issues
    let lastTime = performance.now();

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update uniform time continuously 
      uniforms.uTime.value += delta;

      // Auto-rotation
      if (isPlanet) {
        sphere.rotation.y += delta * 0.2;
      } else {
        sphere.rotation.y += delta * 0.05;
        if (coronaMesh) {
          coronaMesh.rotation.y += delta * 0.08;
        }
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
      // Explicitly clean up WebGL contexts and geometries/materials
      geometry.dispose();
      if (material) {
        material.dispose();
      }
    };
  }, [spectralClass, starType, name]);

  return <div ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', cursor: 'grab', touchAction: 'pan-y', pointerEvents: 'auto' }} />;
}

