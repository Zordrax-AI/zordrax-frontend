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
          "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]",
          variant === "primary" &&
            "bg-[color:var(--accent)] text-[color:var(--accent-fg)] hover:brightness-95",
          variant === "outline" &&
            "border border-[color:var(--border)] text-[color:var(--fg)] hover:bg-[color:var(--card-2)]",
          variant === "ghost" &&
            "text-[color:var(--fg)] hover:bg-[color:var(--card-2)]",
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
