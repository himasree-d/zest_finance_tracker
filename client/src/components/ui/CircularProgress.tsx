import { getProgressColor } from '../../lib/utils';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color,
  children
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  
  const strokeColor = color || getProgressColor(percentage);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-charcoal-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(var(--tw-colors-electric-500),0.3)]"
          style={{ strokeLinecap: 'round' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {children}
      </div>
    </div>
  );
}
