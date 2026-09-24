import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-16 h-10' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 250" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path d="M 0 0 L 280 0 L 320 30 L 280 60 L 160 60 L 60 180 L 0 180 L 100 60 L 0 60 Z" fill="#FFFFFF"/>
        <path d="M 40 70 L 180 70 L 210 95 L 90 95 Z" fill="#FFCC00"/>
        <path d="M 260 95 L 280 130 L 250 200 L 230 165 Z" fill="#FFCC00"/>
        <path d="M 200 0 L 280 0 L 320 30 L 250 30 Z" fill="#666666" opacity="0.8"/>
      </g>
    </svg>
  );
};
