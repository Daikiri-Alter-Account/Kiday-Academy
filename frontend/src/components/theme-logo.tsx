import { useTheme } from "@/components/theme-provider";

type ThemeLogoProps = {
  className?: string;
  alt?: string;
};

export function ThemeLogo({ className = "size-28", alt = "Kiday Studio" }: ThemeLogoProps) {
  const { theme } = useTheme();
  const variant = theme === "light" ? "light" : "dark";

  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/kiday-studio-${variant}.webp`}
      alt={alt}
      width={512}
      height={512}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
