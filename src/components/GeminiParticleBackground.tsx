import React from 'react';

export const GeminiParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-2] bg-slate-950">
      <div className="gen-z-blob blob-1" style={{ animationDelay: '0s' }}></div>
      <div className="gen-z-blob blob-2" style={{ animationDelay: '-5s' }}></div>
      <div className="gen-z-blob blob-3" style={{ animationDelay: '-10s' }}></div>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
    </div>
  );
};

export default GeminiParticleBackground;
