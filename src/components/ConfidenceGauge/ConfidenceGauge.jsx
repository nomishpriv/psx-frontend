import React from 'react';
import './ConfidenceGauge.css';

const ConfidenceGauge = ({ score, size = 'medium', showLabel = true }) => {
  const getColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  const getLevel = (score) => {
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  const getSizeDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, strokeWidth: 6, fontSize: 14 };
      case 'large':
        return { width: 120, height: 120, strokeWidth: 10, fontSize: 24 };
      default:
        return { width: 80, height: 80, strokeWidth: 8, fontSize: 18 };
    }
  };

  const dimensions = getSizeDimensions();
  const radius = (dimensions.width - dimensions.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);
  const level = getLevel(score);

  return (
    <div className={`confidence-gauge-container ${size}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="confidence-gauge-svg"
      >
        {/* Background circle */}
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={dimensions.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={dimensions.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${dimensions.width / 2} ${dimensions.height / 2})`}
          className="confidence-gauge-progress"
        />
        {/* Score text */}
        <text
          x={dimensions.width / 2}
          y={dimensions.height / 2 + dimensions.fontSize / 3}
          textAnchor="middle"
          fill={color}
          fontSize={dimensions.fontSize}
          fontWeight="bold"
          className="confidence-gauge-text"
        >
          {score}%
        </text>
      </svg>
      {showLabel && (
        <div className="confidence-gauge-label">
          <span className={`confidence-level-badge ${level.toLowerCase()}`}>
            {level} Confidence
          </span>
        </div>
      )}
    </div>
  );
};

export default ConfidenceGauge;