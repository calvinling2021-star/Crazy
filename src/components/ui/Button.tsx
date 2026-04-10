import clsx from "clsx";
import Link from "next/link";

interface ButtonProps {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  href,
  variant = "primary",
  children,
  className,
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-block px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-300 text-center",
        variant === "primary" &&
          "bg-molecule-gold text-molecule-black hover:bg-molecule-gold-light",
        variant === "secondary" &&
          "border border-molecule-gold text-molecule-gold hover:bg-molecule-gold hover:text-molecule-black",
        className
      )}
    >
      {children}
    </Link>
  );
}
