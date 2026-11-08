const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function ageFromBirthDate(value, now = new Date()) {
  if (typeof value !== "string" || !BIRTH_DATE_PATTERN.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== value) {
    return null;
  }

  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  let age = currentYear - year;
  const hasHadBirthday =
    currentMonth > month || (currentMonth === month && currentDay >= day);
  if (!hasHadBirthday) age -= 1;

  return age;
}

export function isValidBirthDate(value, now = new Date()) {
  const age = ageFromBirthDate(value, now);
  return age !== null && age >= 5 && age <= 120;
}
