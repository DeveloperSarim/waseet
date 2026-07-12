// "15m" | "30d" | "12h" | "45s"  ->  milliseconds
export function parseDuration(str) {
  const m = /^(\d+)([smhd])$/.exec(String(str).trim())
  if (!m) throw new Error(`Invalid duration: ${str}`)
  const n = Number(m[1])
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]]
  return n * mult
}
