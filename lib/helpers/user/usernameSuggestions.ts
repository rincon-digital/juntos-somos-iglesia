import prisma from "@/lib/prisma";
// Genera sugerencias de usernames basadas en el nombre de usuario base
export async function getUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  let attempt = 1;

  while (suggestions.length < 3 && attempt < 10) {
    // Generamos variantes: user123, user_5, user.88, etc.
    const suffix = Math.floor(Math.random() * 999);
    const candidate = `${baseUsername}${suffix}`;

    const exists = await prisma.user.findUnique({
      where: { username: candidate },
    });

    if (!exists && !suggestions.includes(candidate)) {
      suggestions.push(candidate);
    }
    attempt++;
  }
  return suggestions;
}
