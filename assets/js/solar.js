// assets/js/solar.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(0, 180, 420);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 80;
controls.maxDistance = 1500;

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --- Lights (Sonne als Lichtquelle) ---
scene.add(new THREE.AmbientLight(0x223355, 0.25));
const sunLight = new THREE.PointLight(0xffffff, 2.2, 0, 2);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// --- Background (Sternhimmel) ---
// Einfacher Start: viele Punkte zufällig (später ersetzt du es durch eine Sky-Textur)
const starGeo = new THREE.BufferGeometry();
const starCount = 4000;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 2000 * Math.cbrt(Math.random());
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true })));

// --- Textures Loader ---
const loader = new THREE.TextureLoader();

// TODO: Lege später echte Texturen in /assets/textures/ ab.
// Für den Start nehmen wir Farben + optional Platzhaltertexturen.
function planetMaterial(colorHex, textureUrl) {
  if (!textureUrl) return new THREE.MeshStandardMaterial({ color: colorHex, roughness: 1, metalness: 0 });
  const tex = loader.load(textureUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
}

// --- Daten (plausibel skaliert, nicht „maßstabsgetreu“ in km) ---
const PLANETS = [
  { key: 'mercury', name: 'Merkur', radius: 2.2, dist: 38, orbitDays: 88, rot: 0.004, color: 0x8c8c8c },
  { key: 'venus',   name: 'Venus',  radius: 4.8, dist: 54, orbitDays: 225, rot: 0.0016, color: 0xd9b27c },
  { key: 'earth',   name: 'Erde',   radius: 5.0, dist: 74, orbitDays: 365, rot: 0.02,  color: 0x3b82f6 },
  { key: 'mars',    name: 'Mars',   radius: 2.7, dist: 96, orbitDays: 687, rot: 0.018, color: 0xc2410c },
  { key: 'jupiter', name: 'Jupiter',radius: 13.5,dist: 132,orbitDays: 4333,rot: 0.05,  color: 0xd2b48c },
  { key: 'saturn',  name: 'Saturn', radius: 11.5,dist: 170,orbitDays: 10759,rot: 0.045,color: 0xeab308 },
  { key: 'uranus',  name: 'Uranus', radius: 8.0, dist: 210,orbitDays: 30687,rot: 0.03, color: 0x67e8f9 },
  { key: 'neptune', name: 'Neptun', radius: 7.8, dist: 250,orbitDays: 60190,rot: 0.032,color: 0x2563eb },
];

// --- Sonne ---
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(18, 48, 48),
  new THREE.MeshBasicMaterial({ color: 0xffdd88 })
);
scene.add(sun);

// --- Orbits + Planeten ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickable = [];

function makeOrbitLine(radius, color = 0x223355) {
  const seg = 256;
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
  return new THREE.Line(geo, mat);
}

const system = new THREE.Group();
scene.add(system);

for (const p of PLANETS) {
  system.add(makeOrbitLine(p.dist));

  // Orbit-Container rotiert -> Planet kreist automatisch
  const orbit = new THREE.Object3D();
  system.add(orbit);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.radius, 42, 42),
    planetMaterial(p.color /*, `assets/textures/${p.key}.jpg` */)
  );
  mesh.position.set(p.dist, 0, 0);
  mesh.userData = { ...p, text: `${p.name}: Platzhalter-Text. (Später aus i18n/items)` };
  orbit.add(mesh);

  clickable.push(mesh);

  // Saturn-Ring (optional, stilvoller Eindruck)
  if (p.key === 'saturn') {
    const ringGeo = new THREE.RingGeometry(p.radius * 1.35, p.radius * 2.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf5e6b3, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  p._orbit = orbit;
  p._mesh = mesh;
}

// --- UI: Klick -> Card ---
const card = document.getElementById('card');
const cardTitle = document.getElementById('cardTitle');
const cardText = document.getElementById('cardText');
document.getElementById('close').onclick = () => (card.hidden = true);

function onClick(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  if (hits.length) {
    const p = hits[0].object.userData;
    cardTitle.textContent = p.name;
    cardText.textContent = p.text;
    card.hidden = false;
  }
}
renderer.domElement.addEventListener('click', onClick);

// --- Animation ---
const speed = document.getElementById('speed');
let t = 0;

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const s = Number(speed.value);
  t += 0.01 * s;

  // Sonne rotiert leicht
  sun.rotation.y += 0.002;

  for (const p of PLANETS) {
    // Orbitgeschwindigkeit: invers zur Umlaufdauer (nur optisch)
    const orbitSpeed = (365 / p.orbitDays) * 0.002 * s;
    p._orbit.rotation.y += orbitSpeed;

    // Eigenrotation
    p._mesh.rotation.y += p.rot * s;
  }

  renderer.render(scene, camera);
}
animate();
