import type { Service } from "@/lib/api";

const planIcons: Record<string, string> = {
  "kiday-pro": "kiday-pro.webp",
  "kiday-academy": "kiday-academy.webp",
};

type PlanIconProps = {
  service: Pick<Service, "slug">;
  className?: string;
  alt?: string;
};

export function PlanIcon({ service, className = "size-16", alt = "" }: PlanIconProps) {
  const icon = planIcons[service.slug] ?? "kiday-icon.webp";

  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/${icon}`}
      alt={alt}
      width={512}
      height={512}
      loading="lazy"
      decoding="async"
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
