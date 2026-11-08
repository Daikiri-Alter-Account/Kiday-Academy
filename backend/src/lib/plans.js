export const PLAN_SLUGS = ["kiday-free", "kiday-pro", "kiday-academy"];
export const DEFAULT_PLAN = "kiday-free";

const PLAN_CAPABILITIES = {
  "kiday-free": ["subjects", "tasks", "averager", "calendar"],
  "kiday-pro": [
    "subjects",
    "tasks",
    "averager",
    "calendar",
    "assistant",
    "materials",
    "smart-reminders",
  ],
  "kiday-academy": [
    "subjects",
    "tasks",
    "averager",
    "calendar",
    "assistant",
    "materials",
    "smart-reminders",
    "groups",
    "private-chats",
    "mentoring",
    "academic-tracking",
  ],
};

export function normalizePlan(value) {
  return PLAN_SLUGS.includes(value) ? value : DEFAULT_PLAN;
}

export function planCapabilities(plan) {
  return PLAN_CAPABILITIES[normalizePlan(plan)];
}
