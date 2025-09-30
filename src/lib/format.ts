// src/lib/format.ts
export function formatDate(iso?: string | Date | null) {
  if (!iso) return "-"; // evita error si viene null o undefined
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

