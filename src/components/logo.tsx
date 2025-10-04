import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 24,
  className = "",
  color,
}) => {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 32 32"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          .ball {
            fill: currentColor;
            transition: fill 0.8s ease-in-out;
          }
        `}
      </style>

      <defs>
        <mask id="diagonal-mask">
          <rect fill="white" height="32" width="32" />
          <rect
            fill="black"
            height="4"
            transform="rotate(45 16 16)"
            width="26"
            x="3"
            y="5"
          />
        </mask>
      </defs>

      <circle
        className="ball"
        cx="16"
        cy="16"
        mask="url(#diagonal-mask)"
        r="14"
        style={{ fill: color || "currentColor" }}
      />
    </svg>
  );
};
