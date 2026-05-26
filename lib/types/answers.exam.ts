import { QuestionOption } from "@/generated/prisma/enums";

export interface Answer {
  questionId: string;
  response: QuestionOption;
}
