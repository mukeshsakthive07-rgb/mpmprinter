import React from 'react';

export const StarryBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-2] bg-[#0a1931]">
      <div className="gen-z-blob blob-1"></div>
      <div className="gen-z-blob blob-2"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a1931]/80 to-[#0a1931]"></div>
    </div>
  );
};

export default StarryBackground;
