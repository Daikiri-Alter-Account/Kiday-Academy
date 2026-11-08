import { Link } from "react-router-dom";

type BrandProps = {
  to?: string;
  onClick?: () => void;
};

export function Brand({ to = "/", onClick }: BrandProps) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5" aria-label="Kiday Studio, inicio">
      <img
        src={`${import.meta.env.BASE_URL}brand/kiday-icon.webp`}
        alt=""
        width={512}
        height={512}
        className="size-10 shrink-0 object-contain drop-shadow-[0_4px_16px_rgba(124,58,237,0.35)]"
        draggable={false}
      />
      <span className="bg-gradient-to-r from-[var(--foreground)] via-violet-300 to-indigo-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
        Kiday Studio
      </span>
    </Link>
  );
}
