import { Atom } from "lucide-react";
import { Link } from "react-router-dom";

type BrandProps = {
  to?: string;
  onClick?: () => void;
};

export function Brand({ to = "/", onClick }: BrandProps) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5" aria-label="Kiday Studio, inicio">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-950/50">
        <Atom size={20} strokeWidth={2.2} />
      </span>
      <span className="bg-gradient-to-r from-[var(--foreground)] via-violet-300 to-indigo-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
        Kiday Studio
      </span>
    </Link>
  );
}
