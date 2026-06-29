import React from "react";

interface RoleSyncLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  size?: number;
  textColor?: string;
}

export function RoleSyncLogo({
  className = "",
  iconClassName = "",
  showText = true,
  size = 48,
  textColor = "text-foreground"
}: RoleSyncLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src="/logo.svg"
        alt="RoleSync Logo"
        width={size}
        height={size}
        className={`object-contain ${iconClassName}`}
        style={{ width: size, height: size }}
      />
      {showText && (
        <span 
          className={`font-heading font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600 dark:from-white dark:to-slate-300 font-[Poppins] hidden md:inline-block ${textColor}`}
          style={{ fontSize: Math.max(14, size * 0.42) }}
        >
          RoleSync
        </span>
      )}
    </div>
  );
}
