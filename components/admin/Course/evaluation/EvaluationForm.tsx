"use client";
import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import {
  createEvaluationVideo,
  updateEvaluationVideo,
} from "@/actions/course/video/evaluations/video.evaluations";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

interface EvaluationFormProps {
  videoId: string;
  initialData?: {
    id?: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    correctOption: "A" | "B" | "C";
  };
  onSuccess?: (data?: any) => void; // <--- CAMBIO 1: Le avisamos a TypeScript que existe esta función opcional
}

export default function EvaluationForm({
  videoId,
  initialData,
  onSuccess, // <--- CAMBIO 2: Recibimos la función acá
}: EvaluationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    id: initialData?.id,
    question: initialData?.question || "",
    optionA: initialData?.optionA || "",
    optionB: initialData?.optionB || "",
    optionC: initialData?.optionC || "",
    correctOption: initialData?.correctOption || "A",
    videoId: videoId,
  });

  const handleSave = async () => {
    if (!data.question || !data.optionA || !data.optionB || !data.optionC) {
      toast.error("Por favor, completa la pregunta y las 3 opciones");
      return;
    }

    setLoading(true);
    let res;

    if (data.id) {
      res = await updateEvaluationVideo(data.id, data as any);
    } else {
      res = await createEvaluationVideo(data as any);
    }

    setLoading(false);

    if (res && "success" in res) {
      toast.success("Evaluación guardada correctamente");

      // <--- CAMBIO 3: Si se guardó bien, ejecutamos la función para avisarle al componente padre (CourseVideoManager)
      if (onSuccess) {
        onSuccess(data);
      }

      router.refresh();
    } else {
      toast.error((res && "error" in res && res.error) || "Error al guardar");
    }
  };

  const uid = data.id || `nueva-${videoId}`;

  return (
    <div className="grid grid-cols-2 gap-6 text-[#0a0a0a]">
      {/* Pregunta */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`pregunta-${uid}`} className="text-sm font-medium text-[#292524]">
          Pregunta
        </label>
        <textarea
          id={`pregunta-${uid}`}
          value={data.question}
          onChange={(e) => setData({ ...data, question: e.target.value })}
          className="min-h-[11rem] w-full flex-1 resize-none rounded-xl border border-[#e7e5e4] bg-white p-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
          placeholder="Escribí la pregunta para evaluar al alumno…"
        />
      </div>

      {/* Opciones */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium text-[#292524]">Opciones · tocá la letra de la correcta</legend>
        <div className="space-y-2">
          {(["A", "B", "C"] as const).map((opt) => {
            const isCorrect = data.correctOption === opt;
            return (
              <div key={opt} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setData({ ...data, correctOption: opt })}
                  aria-pressed={isCorrect}
                  aria-label={`Marcar la opción ${opt} como correcta`}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                    isCorrect ? "bg-green-600 text-white" : "bg-[#f5f5f4] text-[#57534e] hover:bg-[#e7e5e4]"
                  }`}
                >
                  {isCorrect ? <CheckCircle2 size={18} aria-hidden="true" /> : opt}
                </button>
                <input
                  type="text"
                  aria-label={`Opción ${opt}`}
                  value={(data as any)[`option${opt}`]}
                  onChange={(e) => setData({ ...data, [`option${opt}`]: e.target.value })}
                  className={`h-11 flex-1 rounded-xl border bg-white px-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[#a8a29e] focus:ring-2 focus:ring-[#FF6B00]/30 ${
                    isCorrect ? "border-green-600" : "border-[#e7e5e4] hover:border-[#d6d3d1] focus:border-[#0a0a0a]"
                  }`}
                  placeholder={`Opción ${opt}`}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Save size={15} aria-hidden="true" />
          {loading ? "Guardando…" : "Guardar pregunta"}
        </button>
      </fieldset>
    </div>
  );
}
