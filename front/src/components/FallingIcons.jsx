import React from 'react';
import './FallingIcons.css';
import logo from '../assets/logo.png';

const FallingIcons = () => {
  const icons = Array.from({ length: 500 });

  return (
    <div className="falling-container">
      {icons.map((_, i) => (
        <img
          key={i}
          src={logo}
          className="falling-icon"
          alt=""
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 100}s`,
            animationDuration: `${5 + Math.random() * 50}s`,
            opacity: 0.2 + Math.random() * 0.4,
            width: `${15 + Math.random() * 30}px`
          }}
        />
      ))}
    </div>
  );
};

export default FallingIcons;