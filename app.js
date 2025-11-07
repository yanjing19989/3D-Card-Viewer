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

// ========== 工具函数 ==========
function getEl(id) { return document.getElementById(id); }
function setVal(id, v) { document.getElementById(id).textContent = v; }

// ========== DOM 引用 ==========
const canvas = document.getElementById('glCanvas');
const canvasContainer = document.querySelector('.canvas-container');
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');

// UI 控件引用
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

// ========== Three.js 场景初始化 ==========
let scene, camera, renderer, controls;
let card, ground, ambient, dirLight;
let frontMat, backMat, sideMat;
let frontMap, backMap;

// 卡片默认参数 (可变——由正面图片决定长宽)
let CARD_W = 2.25;  // 标准卡宽 (单位)
let CARD_H = 3.50;  // 标准卡高 (单位)
const BASE_CARD_W = 2.25; // 当读取图片时以此为参考宽度，按图片长宽比计算高度
let cardThickness = 0.06;
let cornerRadius = 0.06;

function initThreeJS() {
  // 场景
  scene = new Scene();
  scene.background = null;

  // 相机
  camera = new PerspectiveCamera(35, 1, 0.01, 100);
  camera.position.set(-2, -2, 3);

  // 渲染器
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 轨道控制器 (支持触摸操作)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minDistance = 1.2;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);
  // OrbitControls 默认已支持触摸，但确保启用
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,     // 单指旋转
    TWO: THREE.TOUCH.DOLLY_PAN   // 双指缩放和平移
  };
}

// 纹理配置函数
const texOpts = (tex) => {
  if (!tex) return;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 8;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
};

function initMaterials() {
  const textureLoader = new TextureLoader();

  // 创建占位纹理
  const frontPlaceholder = makePlaceholder('FRONT', '#6aa9ff');
  const backPlaceholder = makePlaceholder('BACK', '#7bd8b0');

  frontMap = frontPlaceholder;
  backMap = backPlaceholder;

  updateCardSizeFromTexture(frontMap);

  // 创建材质
  frontMat = new MeshPhysicalMaterial({
    color: new Color(0xffffff),
    map: frontMap,
    roughness: parseFloat(ui.roughness.value),
    metalness: parseFloat(ui.metalness.value),
    clearcoat: parseFloat(ui.clearcoat.value),
    clearcoatRoughness: parseFloat(ui.clearcoatRoughness.value),
  });
  
  backMat = frontMat.clone();
  backMat.map = backMap;

  sideMat = new MeshPhysicalMaterial({
    color: new Color(0x9da3b0),
    roughness: 0.95,
    metalness: 0.0
  });

  return { textureLoader };
}

function initScene() {
  // 从UI读取初始值
  cardThickness = parseFloat(ui.thickness.value);
  cornerRadius = parseFloat(ui.cornerRadius.value);

  // 创建卡片网格
  card = new Mesh(makeCardGeometry(CARD_W, CARD_H, cardThickness, cornerRadius), [
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

  // 地面阴影接收器
  ground = new Mesh(
    new PlaneGeometry(20, 20), 
    new ShadowMaterial({ opacity: parseFloat(ui.shadowOpacity.value) })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -(CARD_H / 2 + 0.05); // 位于卡片底部下方一点
  ground.receiveShadow = true;
  scene.add(ground);

  // 灯光
  ambient = new AmbientLight(0xffffff, parseFloat(ui.ambIntensity.value));
  scene.add(ambient);

  dirLight = new DirectionalLight(0xffffff, parseFloat(ui.dirIntensity.value));
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 25;
  dirLight.shadow.camera.left = -5;
  dirLight.shadow.camera.right = 5;
  dirLight.shadow.camera.top = 5;
  dirLight.shadow.camera.bottom = -5;
  dirLight.shadow.radius = parseFloat(ui.shadowSoft.value);
  updateLightDirection();
  scene.add(dirLight);
}

// ========== 渲染循环 ==========
function resize() {
  const w = canvasContainer.clientWidth;
  const h = canvasContainer.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ========== 侧边栏控制 ==========
function setupSidebarControls() {
  const toggleLeftBtn = getEl('openLeft');
  const toggleRightBtn = getEl('openRight');

  // 左侧栏切换
  toggleLeftBtn.addEventListener('click', () => {
    if (leftSidebar.classList.contains('open')) {
      leftSidebar.classList.remove('open');
    } else {
      leftSidebar.classList.add('open');
    }
  });

  // 右侧栏切换
  toggleRightBtn.addEventListener('click', () => {
    if (rightSidebar.classList.contains('open')) {
      rightSidebar.classList.remove('open');
    } else {
      rightSidebar.classList.add('open');
    }
  });

  // ESC 键关闭侧栏
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      leftSidebar.classList.remove('open');
      rightSidebar.classList.remove('open');
    }
  });
}

// ========== 参数控制绑定 ==========
function bindRange(input, onChange, labelId, format = (v) => v) {
  const apply = () => {
    const val = parseFloat(input.value);
    setVal(labelId, format(val));
    onChange(val);
  };
  input.addEventListener('input', apply);
  apply();

  // 手机端拖拽滑块时临时隐藏右侧边栏
  let isDragging = false;
  const hideSidebarOnDrag = () => {
    if (window.innerWidth <= 768 && rightSidebar.classList.contains('open')) {
      isDragging = true;
      rightSidebar.style.opacity = '0';
      rightSidebar.style.pointerEvents = 'none';
    }
  };
  const showSidebarOnRelease = () => {
    if (isDragging) {
      isDragging = false;
      rightSidebar.style.opacity = '';
      rightSidebar.style.pointerEvents = '';
    }
  };

  // 监听触摸和鼠标事件
  input.addEventListener('pointerdown', hideSidebarOnDrag);
  input.addEventListener('pointerup', showSidebarOnRelease);
  input.addEventListener('pointercancel', showSidebarOnRelease);
}

function setupControls() {
  // 卡片参数
  bindRange(ui.thickness, (v) => {
    cardThickness = v;
    rebuildCard();
  }, 'thicknessVal', (v) => Number(v).toFixed(3));

  bindRange(ui.cornerRadius, (v) => {
    cornerRadius = v;
    rebuildCard();
  }, 'cornerRadiusVal', (v) => Number(v).toFixed(3));

  // 光照参数
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

  // 阴影参数
  bindRange(ui.shadowOpacity, (v) => {
    ground.material.opacity = v;
  }, 'shadowOpacityVal');

  bindRange(ui.shadowSoft, (v) => {
    dirLight.shadow.radius = v;
  }, 'shadowSoftVal', (v) => Number(v).toFixed(1));

  // 材质参数
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
  }, 'clearcoatRoughnessVal', (v) => Number(v).toFixed(2));
}

// ========== 文件加载 ==========
function loadTexture(url, textureLoader) {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, (tex) => {
      texOpts(tex);
      resolve(tex);
    }, undefined, reject);
  });
}

function setupFileInputs(textureLoader) {
  // 正面图片
  ui.frontImg.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    ui.frontPreview.src = url;
    loadTexture(url, textureLoader).then(tex => {
      frontMap = tex;
      frontMat.map = frontMap;
      frontMat.needsUpdate = true;
      // 根据图片尺寸更新卡片长宽并重建
      if (updateCardSizeFromTexture(tex) && card) rebuildCard();
    }).finally(() => URL.revokeObjectURL(url));
  });

  // 背面图片
  ui.backImg.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    ui.backPreview.src = url;
    loadTexture(url, textureLoader).then(tex => {
      backMap = tex;
      backMat.map = backMap;
      backMat.needsUpdate = true;
    }).finally(() => URL.revokeObjectURL(url));
  });

  // 拖放支持
  setupDragAndDrop(textureLoader);
}

function setupDragAndDrop(textureLoader) {
  ['frontPreview', 'backPreview'].forEach(id => {
    const el = getEl(id).parentElement;
    
    el.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      el.style.outline = '1px dashed var(--brand)';
    });
    
    el.addEventListener('dragleave', () => {
      el.style.outline = '';
    });
    
    el.addEventListener('drop', (ev) => {
      ev.preventDefault();
      el.style.outline = '';
      const file = ev.dataTransfer?.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      
      if (id === 'frontPreview') {
        ui.frontPreview.src = url;
        loadTexture(url, textureLoader).then(tex => {
          frontMap = tex;
          frontMat.map = frontMap;
          frontMat.needsUpdate = true;
          if (updateCardSizeFromTexture(tex) && card) rebuildCard();
        }).finally(() => URL.revokeObjectURL(url));
      } else {
        ui.backPreview.src = url;
        loadTexture(url, textureLoader).then(tex => {
          backMap = tex;
          backMat.map = backMap;
          backMat.needsUpdate = true;
        }).finally(() => URL.revokeObjectURL(url));
      }
    });
  });
}

// ========== 按钮操作 ==========
function setupButtons() {
  // 重置视角
  ui.resetView.addEventListener('click', () => {
    camera.position.set(-2, -2, 3);
    controls.target.set(0, 0, 0);
    controls.update();
  });

  // 导出PNG
  ui.exportPng.addEventListener('click', () => {
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

  // 交换正反面
  ui.swapFaces.addEventListener('click', () => {
    const tmpTex = frontMat.map;
    frontMat.map = backMat.map;
    backMat.map = tmpTex;
    const tmpSrc = ui.frontPreview.src;
    ui.frontPreview.src = ui.backPreview.src;
    ui.backPreview.src = tmpSrc;
    frontMat.needsUpdate = true;
    backMat.needsUpdate = true;
    // 交换后如果新的正面纹理包含图像信息，则根据其尺寸更新卡片并重建
    if (updateCardSizeFromTexture(frontMat.map) && card) rebuildCard();
  });
}

// ========== 触摸增强支持 ==========
function setupTouchEnhancements() {
  // 阻止画布上的默认触摸行为（如页面滚动）
  canvas.addEventListener('touchstart', (e) => {
    // 允许 OrbitControls 处理，但阻止页面滚动
    if (e.touches.length > 0) {
      e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
  }, { passive: false });
}

// ========== 辅助函数 ==========
function updateLightDirection() {
  const az = MathUtils.degToRad(parseFloat(ui.azimuth.value));
  const el = MathUtils.degToRad(parseFloat(ui.elevation.value));
  const r = 8.0;
  const pos = new Vector3().setFromSphericalCoords(r, Math.PI / 2 - el, az);
  dirLight.position.copy(pos);
  dirLight.target.position.set(0, 0, 0);
  scene.add(dirLight.target);
}

function makeCardGeometry(w, h, d, r) {
  const radius = Math.min(r, 0.45 * Math.min(w, h));
  return new RoundedBoxGeometry(w, h, d, 6, radius);
}

function rebuildCard() {
  const newGeo = makeCardGeometry(CARD_W, CARD_H, cardThickness, cornerRadius);
  card.geometry.dispose();
  card.geometry = newGeo;
  // 更新地面位置以匹配新的卡片高度
  if (ground) {
    ground.position.y = -(CARD_H / 2 + 0.05);
  }
}

function makePlaceholder(text, color) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // 渐变背景
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, shade(color, -16));
  g.addColorStop(1, shade(color, 18));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 网格
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let x = 0; x <= size; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // 文字
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 140px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(c);
  texOpts(tex);
  return tex;
}

// 根据纹理的图像尺寸更新卡片宽高（前面纹理决定卡片尺寸）
function updateCardSizeFromTexture(tex) {
  if (!tex || !tex.image) return false;
  const aspect = tex.image.width / tex.image.height;
  CARD_W = BASE_CARD_W;
  CARD_H = BASE_CARD_W / aspect;
  return true;
}

function shade(hex, amt) {
  const col = hex.replace('#', '');
  const num = parseInt(col, 16);
  let r = (num >> 16) + amt,
    g = ((num >> 8) & 0xff) + amt,
    b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

function initPreviews() {
  const toURL = (tex) => {
    try {
      if (tex.image && tex.image.toDataURL) return tex.image.toDataURL('image/png');
    } catch {}
    return '';
  };
  ui.frontPreview.src = toURL(frontMap);
  ui.backPreview.src = toURL(backMap);
}

// ========== 主初始化 ==========
function init() {
  // 初始化 Three.js
  initThreeJS();
  
  // 初始化材质
  const { textureLoader } = initMaterials();
  
  // 初始化场景
  initScene();
  
  // 设置界面控制
  setupSidebarControls();
  setupControls();
  setupFileInputs(textureLoader);
  setupButtons();
  setupTouchEnhancements();
  
  // 初始化预览
  initPreviews();
  
  // 启动渲染
  window.addEventListener('resize', resize, { passive: true });
  resize();
  animate();
}

// 页面加载完成后初始化
window.addEventListener('load', init);