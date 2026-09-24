import React from 'react';
import { Logo } from './Logo';

interface BrandNameProps {
  className?: string;
  subClassName?: string;
  asHeading?: boolean;
}

export const BrandName: React.FC<BrandNameProps> = ({
  className = 'text-white font-extrabold font-serif tracking-tight',
  subClassName = 'text-amber-400 font-bold lowercase tracking-normal font-sans',
}) => {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo className="w-10 h-6 shrink-0" />
      <span className="inline-flex items-baseline">
        <span>TransCar</span>
        <sub className={`text-[0.6em] ml-0.5 align-baseline relative -bottom-[0.25em] ${subClassName}`}>
          rongai
        </sub>
      </span>
    </span>
  );
};
