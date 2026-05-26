export function isValidRank(rank: string): string | null {
  if (!["concurre", "miembro"].includes(rank)) {
    return null;
  }
  return rank;
}
