import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const {
  Scene, PerspectiveCamera, WebGLRenderer,
  Color, ACESFilmicToneMapping, SRGBColorSpace,
  AmbientLight, DirectionalLight, ShadowMaterial,
  Mesh, MeshPhysicalMaterial, PlaneGeometry,
  TextureLoader, Vector3, MathUtils
} = THREE;

// DOM refs
const canvas = document.getElementById('glCanvas');
const canvasContainer = document.querySelector('.canvas-container');

// Sidebars
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');
document.getElementById('openLeft').onclick = () => leftSidebar.classList.add('open');
document.getElementById('openRight').onclick = () => rightSidebar.classList.add('open');
document.getElementById('closeLeft').onclick = () => leftSidebar.classList.remove('open');
document.getElementById('closeRight').onclick = () => rightSidebar.classList.remove('open');

// Help popovers
document.querySelectorAll('.help-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = btn.dataset.help;
    const pop = document.getElementById(id);
    const isOpen = pop.classList.contains('open');
    document.querySelectorAll('.help-popover').forEach(p => p.classList.remove('open'));
    if (!isOpen) pop.classList.add('open');
    e.stopPropagation();
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.help-popover').forEach(p => p.classList.remove('open'));
});

// Controls
const ui = {
  thickness: getEl('thickness'),
  cornerRadius: getEl('cornerRadius'),

  dirIntensity: getEl('dirIntensity'),
  ambIntensity: getEl('ambIntensity'),
  azimuth: getEl('azimuth'),
  elevation: getEl('elevation'),

  shadowOpacity: getEl('shadowOpacity'),
  shadowSoft: getEl('shadowSoft'),

  roughness: getEl('roughness'),
  metalness: getEl('metalness'),
  clearcoat: getEl('clearcoat'),
  clearcoatRoughness: getEl('clearcoatRoughness'),

  frontImg: getEl('frontImg'),
  backImg: getEl('backImg'),
  frontPreview: getEl('frontPreview'),
  backPreview: getEl('backPreview'),

  resetView: getEl('resetView'),
  exportPng: getEl('exportPng'),
  swapFaces: getEl('swapFaces'),
};

function getEl(id) { return document.getElementById(id); }
function setVal(id, v) { document.getElementById(id).textContent = v; }

// Three.js setup
const scene = new Scene();
scene.background = null;

const camera = new PerspectiveCamera(35, 1, 0.01, 100);
camera.position.set(0.8, 0.9, 3.7);

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.minDistance = 1.2;
controls.maxDistance = 12;
controls.target.set(0, 0, 0);

// Card defaults
const CARD_W = 2.25;  // 标准卡宽 (单位)
const CARD_H = 3.50;  // 标准卡高 (单位)
let cardThickness = parseFloat(ui.thickness.value); // depth
let cornerRadius = parseFloat(ui.cornerRadius.value);

// Materials
const textureLoader = new TextureLoader();
const texOpts = (tex) => {
  if (!tex) return;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 8;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
};

// Placeholder textures
const frontPlaceholder = makePlaceholder('FRONT', '#6aa9ff');
const backPlaceholder = makePlaceholder('BACK', '#7bd8b0');

let frontMap = frontPlaceholder;
let backMap = backPlaceholder;

// Mesh materials
const frontMat = new MeshPhysicalMaterial({
  color: new Color(0xffffff),
  map: frontMap,
  roughness: parseFloat(ui.roughness.value),
  metalness: parseFloat(ui.metalness.value),
  clearcoat: parseFloat(ui.clearcoat.value),
  clearcoatRoughness: parseFloat(ui.clearcoatRoughness.value),
});
const backMat = frontMat.clone();
backMat.map = backMap;

const sideMat = new MeshPhysicalMaterial({
  color: new Color(0x9da3b0),
  roughness: 0.95,
  metalness: 0.0
});

// Geometry and mesh
let card = new Mesh(makeCardGeometry(CARD_W, CARD_H, cardThickness, cornerRadius), [
  sideMat, // +X
  sideMat, // -X
  sideMat, // +Y
  sideMat, // -Y
  frontMat, // +Z => front
  backMat,  // -Z => back
]);
card.castShadow = true;
card.receiveShadow = false;
scene.add(card);

// Ground receiver for shadow
const ground = new Mesh(new PlaneGeometry(20, 20), new ShadowMaterial({ opacity: parseFloat(ui.shadowOpacity.value) }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.1;
ground.receiveShadow = true;
scene.add(ground);

// Lights
const ambient = new AmbientLight(0xffffff, parseFloat(ui.ambIntensity.value));
scene.add(ambient);

const dirLight = new DirectionalLight(0xffffff, parseFloat(ui.dirIntensity.value));
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 25;
dirLight.shadow.radius = parseFloat(ui.shadowSoft.value);
updateLightDirection();
scene.add(dirLight);

// Size and render loop
function resize() {
  const w = canvasContainer.clientWidth;
  const h = canvasContainer.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize, { passive: true });
resize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// UI bindings
bindRange(ui.thickness, (v) => {
  cardThickness = v;
  rebuildCard();
}, 'thicknessVal');

bindRange(ui.cornerRadius, (v) => {
  cornerRadius = v;
  rebuildCard();
}, 'cornerRadiusVal');

bindRange(ui.dirIntensity, (v) => {
  dirLight.intensity = v;
}, 'dirIntensityVal');

bindRange(ui.ambIntensity, (v) => {
  ambient.intensity = v;
}, 'ambIntensityVal');

bindRange(ui.azimuth, (v) => {
  updateLightDirection();
}, 'azimuthVal');

bindRange(ui.elevation, (v) => {
  updateLightDirection();
}, 'elevationVal');

bindRange(ui.shadowOpacity, (v) => {
  ground.material.opacity = v;
}, 'shadowOpacityVal');

bindRange(ui.shadowSoft, (v) => {
  // Works with PCFSoftShadowMap; higher radius => blurrier
  dirLight.shadow.radius = v;
}, 'shadowSoftVal', (v)=>Number(v).toFixed(1));

bindRange(ui.roughness, (v) => {
  frontMat.roughness = v;
  backMat.roughness = v;
}, 'roughnessVal');

bindRange(ui.metalness, (v) => {
  frontMat.metalness = v;
  backMat.metalness = v;
}, 'metalnessVal');

bindRange(ui.clearcoat, (v) => {
  frontMat.clearcoat = v;
  backMat.clearcoat = v;
}, 'clearcoatVal');

bindRange(ui.clearcoatRoughness, (v) => {
  frontMat.clearcoatRoughness = v;
  backMat.clearcoatRoughness = v;
}, 'clearcoatRoughnessVal', (v)=>Number(v).toFixed(2));

// File inputs
ui.frontImg.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  ui.frontPreview.src = url;
  loadTexture(url).then(tex => {
    frontMap = tex;
    frontMat.map = frontMap;
    frontMat.needsUpdate = true;
  }).finally(()=> URL.revokeObjectURL(url));
});

ui.backImg.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  ui.backPreview.src = url;
  loadTexture(url).then(tex => {
    backMap = tex;
    backMat.map = backMap;
    backMat.needsUpdate = true;
  }).finally(()=> URL.revokeObjectURL(url));
});

// Drag & drop on preview areas
;['frontPreview','backPreview'].forEach(id => {
  const el = getEl(id).parentElement;
  el.addEventListener('dragover', (ev) => { ev.preventDefault(); el.style.outline = '1px dashed var(--brand)'; });
  el.addEventListener('dragleave', () => { el.style.outline = ''; });
  el.addEventListener('drop', (ev) => {
    ev.preventDefault(); el.style.outline = '';
    const file = ev.dataTransfer?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (id === 'frontPreview') {
      ui.frontPreview.src = url;
      loadTexture(url).then(tex => {
        frontMap = tex; frontMat.map = frontMap; frontMat.needsUpdate = true;
      }).finally(()=> URL.revokeObjectURL(url));
    } else {
      ui.backPreview.src = url;
      loadTexture(url).then(tex => {
        backMap = tex; backMat.map = backMap; backMat.needsUpdate = true;
      }).finally(()=> URL.revokeObjectURL(url));
    }
  });
});

// Buttons
ui.resetView.addEventListener('click', () => {
  camera.position.set(0.8, 0.9, 3.7);
  controls.target.set(0, 0, 0);
  controls.update();
});

ui.exportPng.addEventListener('click', () => {
  // Temporary boost resolution
  const prev = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 3));
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'card-snapshot.png';
  a.click();
  renderer.setPixelRatio(prev);
});

ui.swapFaces.addEventListener('click', () => {
  const tmpTex = frontMat.map;
  frontMat.map = backMat.map;
  backMat.map = tmpTex;
  const tmpSrc = ui.frontPreview.src;
  ui.frontPreview.src = ui.backPreview.src;
  ui.backPreview.src = tmpSrc;
  frontMat.needsUpdate = true;
  backMat.needsUpdate = true;
});

// Helpers
function bindRange(input, onChange, labelId, format = (v)=>v) {
  const apply = () => {
    const val = parseFloat(input.value);
    setVal(labelId, format(val));
    onChange(val);
  };
  input.addEventListener('input', apply);
  apply();
}

function updateLightDirection() {
  const az = MathUtils.degToRad(parseFloat(ui.azimuth.value));
  const el = MathUtils.degToRad(parseFloat(ui.elevation.value));
  const r = 8.0;
  const pos = new Vector3().setFromSphericalCoords(r, Math.PI/2 - el, az);
  dirLight.position.copy(pos);
  dirLight.target.position.set(0, 0, 0);
  scene.add(dirLight.target);
}

function makeCardGeometry(w, h, d, r) {
  // RoundedBoxGeometry: (width, height, depth, segments, radius)
  const radius = Math.min(r, 0.45 * Math.min(w, h));
  return new RoundedBoxGeometry(w, h, d, 6, radius);
}

function rebuildCard() {
  const newGeo = makeCardGeometry(CARD_W, CARD_H, cardThickness, cornerRadius);
  card.geometry.dispose();
  card.geometry = newGeo;
}

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, (tex) => {
      texOpts(tex);
      resolve(tex);
    }, undefined, reject);
  });
}

function makePlaceholder(text, color) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // Gradient background
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, shade(color, -16));
  g.addColorStop(1, shade(color, 18));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let x=0; x<=size; x+=step) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,size); ctx.stroke();
  }
  for (let y=0; y<=size; y+=step) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(size,y); ctx.stroke();
  }

  // Text
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 140px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size/2, size/2);

  const tex = new THREE.CanvasTexture(c);
  texOpts(tex);
  return tex;
}

function shade(hex, amt) {
  // hex like '#6aa9ff'
  const col = hex.replace('#','');
  const num = parseInt(col, 16);
  let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (r<<16 | g<<8 | b).toString(16).padStart(6,'0');
}

// Initialize previews
(() => {
  // Show placeholders as data URLs
  const toURL = (tex) => {
    // Render texture canvas if available; for CanvasTexture, we have image = canvas
    try {
      if (tex.image && tex.image.toDataURL) return tex.image.toDataURL('image/png');
    } catch {}
    return '';
  };
  ui.frontPreview.src = toURL(frontPlaceholder);
  ui.backPreview.src = toURL(backPlaceholder);
})();