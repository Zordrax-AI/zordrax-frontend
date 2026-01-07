"use client";

import { forwardRef } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      onClick,
      variant = "primary",
      className,
      disabled = false,
      type = "button",
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition",
          "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950",
          variant === "primary" &&
            "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
          variant === "outline" &&
            "border border-slate-700 text-slate-200 hover:bg-slate-900",
          variant === "ghost" &&
            "text-slate-300 hover:bg-slate-900",
          disabled &&
            "cursor-not-allowed opacity-50 hover:bg-inherit",
          className
        )}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
