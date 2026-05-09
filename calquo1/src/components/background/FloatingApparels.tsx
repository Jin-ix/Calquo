import React from 'react';

export const FloatingApparels: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* 
        Ultra-clean studio lighting background. 
        Replaces the old pastel falling icons with a sophisticated, 
        minimalist editorial canvas.
      */}
      <div
        className="absolute inset-x-0 top-0 h-[50vh] bg-gradient-to-b from-stone-50/80 to-transparent"
        style={{ zIndex: -1 }}
      />
      <div
        className="absolute inset-0 bg-stone-50/40"
        style={{
          background: `
            radial-gradient(circle at 25% 0%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 75% 100%, rgba(245, 245, 244, 0.6) 0%, transparent 50%)
          `,
          zIndex: -2
        }}
      />
    </div>
  );
};
