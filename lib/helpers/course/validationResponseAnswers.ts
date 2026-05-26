import { QuestionOption } from "@/generated/prisma/enums";

export function validationResponseAnswers(response: QuestionOption) {
  // Validar que la respuesta sea una de las permitidas (A, B o C)
  if (!Object.values(QuestionOption).includes(response)) {
    return { error: "La respuesta debe ser A, B o C." };
  }
}
