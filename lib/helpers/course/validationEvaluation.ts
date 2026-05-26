import { evaluationVideo } from "@/lib/types/evaluations.video.definitios";
import { QuestionOption } from "@/generated/prisma/enums";

export function EvaluationValidation(data: evaluationVideo) {
  // 2. Validaciones de Texto
  const question = data.question.trim();
  if (question.length < 5) {
    return { error: "La pregunta debe contener almenos 5 caracteres." };
  }

  if (!data.optionA.trim() || !data.optionB.trim() || !data.optionC.trim()) {
    return { error: "Todas las opciones (A, B y C) son obligatorias." };
  }

  // 3. Validar que la opción correcta sea una de las permitidas (A, B o C)
  if (!Object.values(QuestionOption).includes(data.correctOption)) {
    return { error: "La opción correcta debe ser A, B o C." };
  }
}
