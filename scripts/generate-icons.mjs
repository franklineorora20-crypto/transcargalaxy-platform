import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Generates the exact TransCar "T / TC" + Winding Road + Up-Right Arrow SVG
 * Strictly uses:
 * - Black: #0A0A0A
 * - Yellow: #FFC300
 * - White: #FFFFFF
 * Shape: Rounded square with 22% corner radius (112.64px on 512x512 canvas)
 */
function buildIconSvg({ size = 512, is3D = false, isMaskable = false }) {
  // For maskable icon: 20% safe-area padding (80% content scale = 0.80, centered on full-bleed #0A0A0A)
  const contentTransform = isMaskable
    ? 'translate(51.2, 51.2) scale(0.8)'
    : '';

  // 22% border radius on 512 is 112.64
  const bgRect = isMaskable
    ? `<rect x="0" y="0" width="512" height="512" fill="#0A0A0A" />`
    : `<rect x="0" y="0" width="512" height="512" rx="112.64" ry="112.64" fill="#0A0A0A" />`;

  // Core geometry paths traced from the uploaded reference icon (512x512 coordinate space)
  // 1. Top-Left Yellow Wing of the stylized "T"
  const leftWingPath = `
    M 74 188
    L 94 140
    C 103 120, 122 112, 148 112
    L 276 112
    C 279 112, 280 116, 277 118
    C 242 132, 212 156, 195 188
    L 74 188
    Z
  `;

  // 2. Main Stylized "T / C" Yellow Stem curving down into the winding road
  const mainYellowStemPath = `
    M 316 112
    L 426 112
    C 433 112, 437 117, 434 124
    L 416 164
    C 408 180, 392 188, 370 188
    L 292 188
    C 272 188, 258 197, 250 215
    L 228 267
    C 202 282, 192 301, 200 324
    C 208 345, 232 360, 248 377
    C 264 394, 263 415, 247 436
    L 215 472
    L 172 472
    C 167 472, 165 468, 168 463
    L 209 412
    C 220 398, 219 382, 202 372
    L 168 355
    C 141 342, 134 316, 146 286
    L 190 182
    C 214 132, 260 112, 316 112
    Z
  `;

  // 3. Yellow Arrow Head at the top-right end of the road
  const yellowArrowPath = `
    M 254 256
    L 330 222
    L 304 206
    C 299 203, 301 198, 307 198
    L 392 201
    C 399 201, 402 206, 398 212
    L 340 286
    C 336 291, 331 289, 333 283
    L 343 244
    L 254 256
    Z
  `;

  // 4. White Winding Road (#FFFFFF) integrated along the right side of the yellow curve
  const whiteRoadPath = `
    M 215 472
    C 231 451, 247 436, 256 418
    C 269 392, 256 372, 231 353
    C 205 333, 194 312, 202 290
    C 210 268, 242 252, 312 234
    L 343 244
    C 286 266, 255 282, 251 298
    C 247 314, 264 329, 291 347
    C 322 367, 335 392, 322 424
    C 314 443, 303 458, 295 472
    L 215 472
    Z
  `;

  // 5. Black (#0A0A0A) Dashed Center Line along the White Winding Road
  const roadDashes = `
    <path d="M 258 462 L 274 438" stroke="#0A0A0A" stroke-width="8" stroke-linecap="square" fill="none" />
    <path d="M 286 414 C 290 400, 289 390, 284 380" stroke="#0A0A0A" stroke-width="7.5" stroke-linecap="square" fill="none" />
    <path d="M 268 358 L 243 340" stroke="#0A0A0A" stroke-width="7" stroke-linecap="square" fill="none" />
    <path d="M 227 318 C 221 307, 221 297, 226 288" stroke="#0A0A0A" stroke-width="6.5" stroke-linecap="square" fill="none" />
    <path d="M 244 272 L 266 261" stroke="#0A0A0A" stroke-width="6" stroke-linecap="square" fill="none" />
    <path d="M 286 252 L 306 245" stroke="#0A0A0A" stroke-width="5.5" stroke-linecap="square" fill="none" />
  `;

  // 3D version adds subtle extrusion & gloss using strictly #0A0A0A, #FFC300, #FFFFFF with opacity
  const defs3D = is3D
    ? `
    <defs>
      <filter id="extrudeShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0A0A0A" flood-opacity="0.85" />
      </filter>
      <linearGradient id="glossOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.14" />
        <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.02" />
        <stop offset="100%" stop-color="#0A0A0A" stop-opacity="0.25" />
      </linearGradient>
    </defs>
    `
    : '';

  // For 3D marketing version: subtle offset layer + top specular rim in #FFFFFF (opacity) and #FFC300
  const extrusionLayer = is3D
    ? `
    <g transform="translate(0, 7)" opacity="0.55">
      <path d="${leftWingPath}" fill="#FFC300" />
      <path d="${mainYellowStemPath}" fill="#FFC300" />
      <path d="${yellowArrowPath}" fill="#FFC300" />
      <path d="${whiteRoadPath}" fill="#FFFFFF" />
    </g>
    <g transform="translate(0, 4)">
      <path d="${leftWingPath}" fill="#0A0A0A" />
      <path d="${mainYellowStemPath}" fill="#0A0A0A" />
      <path d="${yellowArrowPath}" fill="#0A0A0A" />
      <path d="${whiteRoadPath}" fill="#0A0A0A" />
    </g>
    `
    : '';

  const baseGloss = is3D && !isMaskable
    ? `<rect x="4" y="4" width="504" height="504" rx="108" ry="108" fill="url(#glossOverlay)" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="2" />`
    : '';

  const highlight3D = is3D
    ? `
    <path d="${leftWingPath}" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2" />
    <path d="${mainYellowStemPath}" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2" />
    `
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
    ${defs3D}
    ${bgRect}
    ${baseGloss}
    <g transform="${contentTransform}" ${is3D ? 'filter="url(#extrudeShadow)"' : ''}>
      ${extrusionLayer}
      <path d="${leftWingPath}" fill="#FFC300" />
      <path d="${mainYellowStemPath}" fill="#FFC300" />
      <path d="${whiteRoadPath}" fill="#FFFFFF" />
      ${roadDashes}
      <path d="${yellowArrowPath}" fill="#FFC300" />
      ${highlight3D}
    </g>
  </svg>`;
}

/**
 * Wraps a 32x32 PNG buffer into a standards-compliant ICO binary buffer
 */
function createIcoFromPngBuffer(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type (1)
  header.writeUInt16LE(1, 4); // Number of images (1)

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0); // Width 32px
  dirEntry.writeUInt8(32, 1); // Height 32px
  dirEntry.writeUInt8(0, 2);  // Palette colors
  dirEntry.writeUInt8(0, 3);  // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  dirEntry.writeUInt32LE(6 + 16, 12); // Offset of image data (22)

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

async function generateAllIcons() {
  // 1. icon-192.png — 192x192 flat 2D
  const svg192 = buildIconSvg({ size: 192, is3D: false, isMaskable: false });
  await sharp(Buffer.from(svg192))
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-192.png'));

  // 2. icon-512.png — 512x512 flat 2D
  const svg512 = buildIconSvg({ size: 512, is3D: false, isMaskable: false });
  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-512.png'));

  // 3. icon-512-3d.png — 512x512 3D version
  const svg512_3d = buildIconSvg({ size: 512, is3D: true, isMaskable: false });
  await sharp(Buffer.from(svg512_3d))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-512-3d.png'));

  // 4. icon-maskable-512.png — 512x512 flat with 20% safe-area padding (80% content)
  const svgMaskable = buildIconSvg({ size: 512, is3D: false, isMaskable: true });
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));

  // 5. favicon.ico — 32x32 from flat version (saved in both public/icons/favicon.ico and public/favicon.ico)
  const svg32 = buildIconSvg({ size: 32, is3D: false, isMaskable: false });
  const png32Buffer = await sharp(Buffer.from(svg32))
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const icoBuffer = createIcoFromPngBuffer(png32Buffer);
  fs.writeFileSync(path.join(iconsDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // Also update public/favicon.svg to match the flat 2D icon
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg512);

  console.log('Successfully generated all PWA icons in public/icons/:');
  console.log(' - public/icons/icon-192.png');
  console.log(' - public/icons/icon-512.png');
  console.log(' - public/icons/icon-512-3d.png');
  console.log(' - public/icons/icon-maskable-512.png');
  console.log(' - public/icons/favicon.ico & public/favicon.ico');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
