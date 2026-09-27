import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TransCar Shuttle Tracker Icon"
    >
      {/* Rounded square base (22% radius) in solid #0A0A0A */}
      <rect x="0" y="0" width="512" height="512" rx="112.64" ry="112.64" fill="#0A0A0A" />
      {/* Top-Left Yellow Wing (#FFC300) */}
      <path
        d="M 74 188 L 94 140 C 103 120, 122 112, 148 112 L 276 112 C 279 112, 280 116, 277 118 C 242 132, 212 156, 195 188 L 74 188 Z"
        fill="#FFC300"
      />
      {/* Main Stylized T/TC Yellow Stem (#FFC300) */}
      <path
        d="M 316 112 L 426 112 C 433 112, 437 117, 434 124 L 416 164 C 408 180, 392 188, 370 188 L 292 188 C 272 188, 258 197, 250 215 L 228 267 C 202 282, 192 301, 200 324 C 208 345, 232 360, 248 377 C 264 394, 263 415, 247 436 L 215 472 L 172 472 C 167 472, 165 468, 168 463 L 209 412 C 220 398, 219 382, 202 372 L 168 355 C 141 342, 134 316, 146 286 L 190 182 C 214 132, 260 112, 316 112 Z"
        fill="#FFC300"
      />
      {/* White Winding Road (#FFFFFF) */}
      <path
        d="M 215 472 C 231 451, 247 436, 256 418 C 269 392, 256 372, 231 353 C 205 333, 194 312, 202 290 C 210 268, 242 252, 312 234 L 343 244 C 286 266, 255 282, 251 298 C 247 314, 264 329, 291 347 C 322 367, 335 392, 322 424 C 314 443, 303 458, 295 472 L 215 472 Z"
        fill="#FFFFFF"
      />
      {/* Black Dashed Center Line (#0A0A0A) */}
      <path d="M 258 462 L 274 438" stroke="#0A0A0A" strokeWidth="8" strokeLinecap="square" fill="none" />
      <path d="M 286 414 C 290 400, 289 390, 284 380" stroke="#0A0A0A" strokeWidth="7.5" strokeLinecap="square" fill="none" />
      <path d="M 268 358 L 243 340" stroke="#0A0A0A" strokeWidth="7" strokeLinecap="square" fill="none" />
      <path d="M 227 318 C 221 307, 221 297, 226 288" stroke="#0A0A0A" strokeWidth="6.5" strokeLinecap="square" fill="none" />
      <path d="M 244 272 L 266 261" stroke="#0A0A0A" strokeWidth="6" strokeLinecap="square" fill="none" />
      {/* Up-Right Yellow Arrow (#FFC300) */}
      <path
        d="M 254 256 L 330 222 L 304 206 C 299 203, 301 198, 307 198 L 392 201 C 399 201, 402 206, 398 212 L 340 286 C 336 291, 331 289, 333 283 L 343 244 L 254 256 Z"
        fill="#FFC300"
      />
    </svg>
  );
};
