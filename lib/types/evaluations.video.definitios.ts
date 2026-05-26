import { QuestionOption } from "@/generated/prisma/enums";

export interface evaluationVideo {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: QuestionOption;
}
export interface createEvaluation extends evaluationVideo {
  videoId: string;
}
