import React from 'react';
import { Logo } from './Logo';

interface BrandNameProps {
  className?: string;
  subClassName?: string;
  asHeading?: boolean;
  stacked?: boolean;
}

export const BrandName: React.FC<BrandNameProps> = ({
  className = 'text-white font-extrabold font-serif tracking-tight',
  subClassName = 'text-[#FFC300] font-bold lowercase tracking-wider font-sans',
  stacked = false,
}) => {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Logo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-[22%]" />
      {stacked ? (
        <span className="inline-flex flex-col leading-none">
          <span className="leading-none">TransCar</span>
          <span className={`text-[0.52em] mt-1 leading-none ${subClassName}`}>
            rongai
          </span>
        </span>
      ) : (
        <span className="inline-flex items-baseline leading-none">
          <span>TransCar</span>
          <span className={`text-[0.58em] ml-1.5 align-baseline ${subClassName}`}>
            rongai
          </span>
        </span>
      )}
    </span>
  );
};

