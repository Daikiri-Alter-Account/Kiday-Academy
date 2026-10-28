export const servicesSeed = [
  {
    slug: "kiday-free",
    name: "Kiday Free",
    tagline: "Empieza a ordenar tu vida académica",
    description:
      "El punto de partida para organizar materias, actividades y notas sin costo. Ideal para probar el método Kiday.",
    price: 0,
    currency: "COP",
    period: "siempre",
    features: [
      "Materias y actividades ilimitadas",
      "Promediador de notas",
      "Calendario y recordatorios básicos",
    ],
    highlighted: false,
    order: 1,
  },
  {
    slug: "kiday-pro",
    name: "Kiday Pro",
    tagline: "Para estudiantes que quieren ir un paso adelante",
    description:
      "Desbloquea el asistente académico, materiales de estudio y recordatorios inteligentes para rendir mejor cada semestre.",
    price: 19900,
    currency: "COP",
    period: "mes",
    features: [
      "Todo lo de Kiday Free",
      "Asistente IA sin límites",
      "Biblioteca de materiales de estudio",
      "Recordatorios inteligentes",
    ],
    highlighted: true,
    order: 2,
  },
  {
    slug: "kiday-academy",
    name: "Kiday Academy",
    tagline: "Comunidad y acompañamiento para tu semestre",
    description:
      "Estudia acompañado: comunidades por materia, chats privados, asesorías grupales y seguimiento académico.",
    price: 39900,
    currency: "COP",
    period: "mes",
    features: [
      "Todo lo de Kiday Pro",
      "Comunidades y chats privados",
      "Asesorías grupales con mentores",
      "Seguimiento académico personalizado",
    ],
    highlighted: false,
    order: 3,
  },
];
