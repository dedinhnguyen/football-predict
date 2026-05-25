import React from 'react';
import { AlertTriangle } from 'lucide-react';

const MarqueeTicker: React.FC = () => {
  const warningText = "Trang web được tạo ra với mục đích giải trí - Không cố súy cho các hành động cá cược - Cá cược tại Việt Nam là hành vi phạm pháp";

  return (
    <div className="marquee-container py-2 text-xs font-semibold uppercase tracking-wider relative z-50">
      <div className="marquee-content select-none">
        {/* We repeat the item twice to make the infinite scroll seamless when translating by -50% */}
        <div className="marquee-item">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 animate-pulse" />
          <span>{warningText}</span>
        </div>
        <div className="marquee-item">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 animate-pulse" />
          <span>{warningText}</span>
        </div>
      </div>
    </div>
  );
};

export default MarqueeTicker;
