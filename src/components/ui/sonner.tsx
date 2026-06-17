"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={{
        // Match StatHub dark theme
        ["--normal-bg" as string]: "rgba(15, 23, 42, 0.95)",
        ["--normal-text" as string]: "#e2e8f0",
        ["--normal-border" as string]: "rgba(99, 102, 241, 0.3)",
      }}
      {...props}
    />
  );
};

export { Toaster };
