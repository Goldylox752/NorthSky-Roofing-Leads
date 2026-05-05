import Link from "next/link";
import { useMemo } from "react";

export default function Button({
  children,
  onClick,
  href,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  loadingText = "Loading...",
  fullWidth = false,
  trackEvent, // optional analytics hook
}) {
  const base =
    "px-5 py-3 rounded-xl font-semibold transition duration-200 inline-flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-800 hover:bg-gray-900 text-white",
    ghost: "bg-transparent hover:bg-white/10 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const isDisabled = disabled || loading;

  const className = useMemo(() => {
    return [
      base,
      variants[variant] || variants.primary,
      isDisabled ? "opacity-50 cursor-not-allowed" : "",
      fullWidth ? "w-full" : "",
    ].join(" ");
  }, [variant, isDisabled, fullWidth]);

  // =========================
  // CLICK HANDLER (SAFE + TRACKING)
  // =========================
  const handleClick = async (e) => {
    if (isDisabled) return;

    try {
      if (trackEvent) {
        trackEvent({
          type: "button_click",
          variant,
          href: href || null,
        });
      }

      if (onClick) await onClick(e);
    } catch (err) {
      console.error("Button action failed:", err);
    }
  };

  // 🔗 Internal route
  if (href?.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {loading ? loadingText : children}
      </Link>
    );
  }

  // 🌍 External link
  if (href) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {loading ? loadingText : children}
      </a>
    );
  }

  // 🔘 Button
  return (
    <button
      type={type}
      onClick={handleClick}
      className={className}
      disabled={isDisabled}
    >
      {loading ? loadingText : children}
    </button>
  );
}