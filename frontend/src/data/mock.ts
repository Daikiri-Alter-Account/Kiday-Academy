export type SubjectStatus = "al-dia" | "pendiente" | "atrasada";

export type Subject = {
  id: string;
  name: string;
  detail: string;
  icon: string;
  color: string;
  average: number;
  completed: number;
  total: number;
  status: SubjectStatus;
};

export const statusMeta: Record<SubjectStatus, { label: string; className: string }> = {
  "al-dia": { label: "Al día", className: "bg-emerald-400/10 text-emerald-300" },
  pendiente: { label: "Pendiente", className: "bg-amber-400/10 text-amber-300" },
  atrasada: { label: "Atrasada", className: "bg-rose-400/10 text-rose-300" },
};

export const subjects: Subject[] = [
  {
    id: "calculo",
    name: "Cálculo diferencial",
    detail: "Parcial 2 · 4 actividades",
    icon: "∫",
    color: "from-violet-500 to-indigo-500",
    average: 4.5,
    completed: 8,
    total: 10,
    status: "al-dia",
  },
  {
    id: "biologia",
    name: "Biología celular",
    detail: "Quiz · mañana, 9:00 a. m.",
    icon: "◉",
    color: "from-emerald-400 to-teal-500",
    average: 3.9,
    completed: 6,
    total: 10,
    status: "pendiente",
  },
  {
    id: "historia",
    name: "Historia universal",
    detail: "Proyecto · en 3 días",
    icon: "✳",
    color: "from-amber-400 to-orange-500",
    average: 4.2,
    completed: 5,
    total: 8,
    status: "al-dia",
  },
  {
    id: "fisica",
    name: "Física mecánica",
    detail: "Taller · viernes",
    icon: "⚛",
    color: "from-sky-400 to-blue-500",
    average: 3.6,
    completed: 7,
    total: 12,
    status: "pendiente",
  },
  {
    id: "ingles",
    name: "Inglés avanzado",
    detail: "Examen oral · en 5 días",
    icon: "A",
    color: "from-rose-400 to-pink-500",
    average: 4.8,
    completed: 9,
    total: 10,
    status: "al-dia",
  },
  {
    id: "programacion",
    name: "Programación I",
    detail: "Entrega · hoy, 11:59 p. m.",
    icon: "{ }",
    color: "from-fuchsia-400 to-purple-500",
    average: 4.0,
    completed: 4,
    total: 9,
    status: "atrasada",
  },
];

export type StudyGroup = {
  id: string;
  name: string;
  subject: string;
  description: string;
  members: string[];
  memberCount: number;
  nextSession: string;
  accent: string;
};

export const studyGroups: StudyGroup[] = [
  {
    id: "calculo-2",
    name: "Cálculo sin miedo",
    subject: "Cálculo diferencial",
    description: "Repasamos derivadas y resolvemos juntos los talleres del parcial.",
    members: ["LM", "SR", "JP", "AC"],
    memberCount: 12,
    nextSession: "Hoy · 6:00 p. m.",
    accent: "from-violet-500 to-indigo-500",
  },
  {
    id: "bio-celular",
    name: "Células al ataque",
    subject: "Biología celular",
    description: "Grupo de estudio para el quiz y las prácticas de laboratorio.",
    members: ["VT", "DC", "MF"],
    memberCount: 8,
    nextSession: "Mañana · 9:00 a. m.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    id: "code-night",
    name: "Code Night",
    subject: "Programación I",
    description: "Sesiones de pair programming y revisión de entregas antes del cierre.",
    members: ["NS", "PL", "AR", "KM"],
    memberCount: 16,
    nextSession: "Jueves · 8:00 p. m.",
    accent: "from-fuchsia-400 to-purple-500",
  },
];
