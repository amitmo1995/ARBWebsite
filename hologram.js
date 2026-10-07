// ==================== AURBON HERO HOLOGRAM ====================
// Renders the Venom racket as a particle-shell hologram inside a glass
// containment tube, sampled from its product PNG. Uses a Fresnel shader
// for believable glass (bright at grazing edges, invisible face-on),
// depth fog, filmic tone mapping, soft bloom, and a subtle mouse-driven
// camera parallax — the techniques that separate a premium WebGL hero
// from a stack of flat-opacity meshes.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const VENOM_TINT = 0x8a5cff;
const BG_COLOR = 0x05050a;
const ALPHA_THRESHOLD = 60;

// Reads the image at native resolution (no smoothed resize) so particle
// sampling later picks exact, unblended pixels — this is what keeps edges
// crisp instead of blurred by a downscale.
function loadImageData(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, c.width, c.height));
        };
        img.onerror = reject;
        img.src = url;
    });
}

function makeDotTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function makeBeamTexture() {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function makeFloorGlowTexture() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

// Builds a particle cloud from an image's alpha silhouette, sampling one
// exact (unblended) pixel every `stride` pixels. Color is luminance-driven
// and tint-biased so the dark-bodied racket still glows, rather than
// reproducing its literal (near-black) surface color.
function buildParticleGeometry(imageData, tintHex, scale, stride) {
    const { width, height, data } = imageData;
    const positions = [];
    const colors = [];
    const seeds = [];
    const tint = new THREE.Color(tintHex);
    const jitter = stride * 0.8;

    for (let y = 0; y < height; y += stride) {
        for (let x = 0; x < width; x += stride) {
            const idx = (y * width + x) * 4;
            const a = data[idx + 3];
            if (a < ALPHA_THRESHOLD) continue;

            const r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
            const lum = (r + g + b) / 3;
            const brightness = 0.1 + Math.pow(lum, 1.3) * 1.35;

            const px = (x - width / 2 + (Math.random() - 0.5) * jitter) / height * scale;
            const py = (height / 2 - y + (Math.random() - 0.5) * jitter) / height * scale;
            const pz = (Math.random() - 0.5) * 0.22 * scale;

            positions.push(px, py, pz);
            colors.push(
                Math.min(1, tint.r * brightness),
                Math.min(1, tint.g * brightness),
                Math.min(1, tint.b * brightness)
            );
            seeds.push(Math.random() * Math.PI * 2);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.userData.originals = Float32Array.from(positions);
    geo.userData.baseColors = Float32Array.from(colors);
    geo.userData.seeds = Float32Array.from(seeds);
    return geo;
}

function makePointsMaterial(dotTexture) {
    return new THREE.PointsMaterial({
        size: 0.034,
        map: dotTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
        opacity: 0.95,
    });
}

// True Fresnel glass: nearly invisible where the surface faces the camera,
// bright along grazing edges. This is what makes a cylinder read as a
// glass tube instead of a flat-opacity "painted" shape.
function makeGlassMaterial(colorHex) {
    return new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(colorHex) },
            power: { value: 2.6 },
            intensity: { value: 1.4 },
        },
        vertexShader: `
            varying vec3 vNormalV;
            varying vec3 vViewDir;
            void main() {
                vNormalV = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewDir = normalize(-mvPosition.xyz);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float power;
            uniform float intensity;
            varying vec3 vNormalV;
            varying vec3 vViewDir;
            void main() {
                float fresnel = pow(1.0 - abs(dot(normalize(vNormalV), normalize(vViewDir))), power);
                gl_FragColor = vec4(glowColor * intensity, fresnel);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    });
}

// A glass containment tube: Fresnel-shaded cylinder wall, crisp rim rings
// (a bright core line plus a soft outer glow line) at top and bottom, and
// an animated scan ring (returned in userData so the caller can slide it
// up and down each frame).
function makeContainmentTube(colorHex, scale) {
    const group = new THREE.Group();
    const radius = 0.4 * scale;
    const height = 1.18 * scale;

    const wallGeo = new THREE.CylinderGeometry(radius, radius, height, 48, 1, true);
    group.add(new THREE.Mesh(wallGeo, makeGlassMaterial(colorHex)));

    function addRim(y, coreOpacity) {
        const core = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.0032 * scale, 10, 96),
            new THREE.MeshBasicMaterial({
                color: colorHex, transparent: true, opacity: coreOpacity,
                blending: THREE.AdditiveBlending, depthWrite: false,
            })
        );
        const glow = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.013 * scale, 10, 96),
            new THREE.MeshBasicMaterial({
                color: colorHex, transparent: true, opacity: coreOpacity * 0.35,
                blending: THREE.AdditiveBlending, depthWrite: false,
            })
        );
        [core, glow].forEach((ring) => {
            ring.rotation.x = Math.PI / 2;
            ring.position.y = y;
            group.add(ring);
        });
    }
    addRim(height / 2, 0.75);
    addRim(-height / 2, 0.6);

    const scanGeo = new THREE.TorusGeometry(radius, 0.003 * scale, 8, 64);
    const scanMat = new THREE.MeshBasicMaterial({
        color: 0xe4d9ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const scanRing = new THREE.Mesh(scanGeo, scanMat);
    scanRing.rotation.x = Math.PI / 2;
    group.add(scanRing);

    group.userData = { halfHeight: height / 2, scanRing };
    return group;
}

function makeBeam(colorHex, beamTexture, scale) {
    const geo = new THREE.CylinderGeometry(0.005 * scale, 0.005 * scale, 1.25 * scale, 16, 1, true);
    const mat = new THREE.MeshBasicMaterial({
        map: beamTexture,
        color: colorHex,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
}

function makeFloorGlow(colorHex, texture, scale) {
    const geo = new THREE.PlaneGeometry(1.6 * scale, 1.6 * scale);
    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        color: colorHex,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}

async function init() {
    const container = document.getElementById('heroHologram');
    const canvas = document.getElementById('hologramCanvas');
    if (!container || !canvas) return;

    let gl;
    try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (e) { gl = null; }
    if (!gl) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 760;
    const STRIDE = isMobile ? 10 : 6;

    let venomData;
    try {
        venomData = await loadImageData('products/rackets/venom/Venom.png');
    } catch (e) {
        return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.052);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const BASE_CAM = new THREE.Vector3(0, 0.15, 8.0);
    camera.position.copy(BASE_CAM);

    const SCALE = isMobile ? 3.0 : 5.0;
    const dotTex = makeDotTexture();
    const beamTex = makeBeamTexture();
    const floorTex = makeFloorGlowTexture();

    const venomGeo = buildParticleGeometry(venomData, VENOM_TINT, SCALE, STRIDE);
    const venomPoints = new THREE.Points(venomGeo, makePointsMaterial(dotTex));

    const venomGroup = new THREE.Group();
    venomGroup.add(venomPoints);
    venomGroup.add(makeBeam(VENOM_TINT, beamTex, SCALE));

    const venomTube = makeContainmentTube(VENOM_TINT, SCALE);
    venomGroup.add(venomTube);

    const floorGlow = makeFloorGlow(VENOM_TINT, floorTex, SCALE);
    floorGlow.position.y = -venomTube.userData.halfHeight;
    venomGroup.add(floorGlow);

    scene.add(venomGroup);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.5);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    function resize() {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        bloom.setSize(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    const mouseNDC = new THREE.Vector2(0, 0);
    const mouseSmoothed = new THREE.Vector2(0, 0);
    let mouseActive = false;
    window.addEventListener('pointermove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        mouseActive = e.clientX >= rect.left && e.clientX <= rect.right &&
                      e.clientY >= rect.top && e.clientY <= rect.bottom;
    }, { passive: true });
    window.addEventListener('pointerleave', () => { mouseActive = false; });

    const raycaster = new THREE.Raycaster();
    const interactPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeHit = new THREE.Vector3();
    const tmpLocal = new THREE.Vector3();
    const RADIUS = 0.6;
    const STRENGTH = 0.5;

    function applyInteraction(group, points, elapsed) {
        const geo = points.geometry;
        const pos = geo.attributes.position;
        const col = geo.attributes.color;
        const originals = geo.userData.originals;
        const baseColors = geo.userData.baseColors;
        const seeds = geo.userData.seeds;
        const count = pos.count;

        let haveHit = false;
        if (mouseActive) {
            raycaster.setFromCamera(mouseNDC, camera);
            interactPlane.constant = -group.position.z;
            haveHit = raycaster.ray.intersectPlane(interactPlane, planeHit) !== null;
            if (haveHit) {
                tmpLocal.copy(planeHit);
                group.worldToLocal(tmpLocal);
            }
        }

        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            const ox = originals[ix], oy = originals[ix + 1], oz = originals[ix + 2];
            const seed = seeds[i];

            let nx = ox + Math.sin(elapsed * 0.6 + seed) * 0.02;
            let ny = oy + Math.cos(elapsed * 0.5 + seed * 1.3) * 0.02;
            let nz = oz + Math.sin(elapsed * 0.4 + seed * 0.7) * 0.03;

            if (haveHit) {
                const dx = nx - tmpLocal.x, dy = ny - tmpLocal.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < RADIUS) {
                    const f = (1 - d / RADIUS) * STRENGTH;
                    const invD = d > 0.0001 ? 1 / d : 0;
                    nx += dx * invD * f;
                    ny += dy * invD * f;
                    nz += f * 0.35;
                }
            }

            pos.array[ix] = nx;
            pos.array[ix + 1] = ny;
            pos.array[ix + 2] = nz;

            const twinkle = 0.82 + 0.18 * Math.sin(elapsed * 2.1 + seed * 3.0);
            col.array[ix] = baseColors[ix] * twinkle;
            col.array[ix + 1] = baseColors[ix + 1] * twinkle;
            col.array[ix + 2] = baseColors[ix + 2] * twinkle;
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
    }

    const clock = new THREE.Clock();

    function animate() {
        const dt = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;

        if (!reduceMotion) {
            venomGroup.rotation.y = Math.sin(elapsed * 0.18) * 0.22;
            venomGroup.position.y = Math.sin(elapsed * 0.4) * 0.05;

            const { halfHeight, scanRing } = venomTube.userData;
            const scanCycle = (elapsed * 0.35) % 1;
            scanRing.position.y = -halfHeight + scanCycle * (halfHeight * 2);
            scanRing.material.opacity = 0.4 * Math.sin(scanCycle * Math.PI);

            mouseSmoothed.x += (mouseNDC.x - mouseSmoothed.x) * (dt * 2.2);
            mouseSmoothed.y += (mouseNDC.y - mouseSmoothed.y) * (dt * 2.2);
            camera.position.x = BASE_CAM.x + mouseSmoothed.x * 0.35;
            camera.position.y = BASE_CAM.y + mouseSmoothed.y * 0.22;
            camera.lookAt(0, 0, 0);

            applyInteraction(venomGroup, venomPoints, elapsed);

            composer.render();
            requestAnimationFrame(animate);
        } else {
            composer.render();
        }
    }
    requestAnimationFrame(animate);
}

init();
