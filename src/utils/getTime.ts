export const getTime = (timestamp: Date): string => {
  const date = new Date(timestamp);
  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(deltaSeconds) < 60) return relative.format(deltaSeconds, "second");

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) return relative.format(deltaMinutes, "minute");

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) return relative.format(deltaHours, "hour");

  const deltaDays = Math.round(deltaHours / 24);
  if (Math.abs(deltaDays) < 7) return relative.format(deltaDays, "day");

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
