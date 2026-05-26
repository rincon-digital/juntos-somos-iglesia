"use client";
import { useState } from "react";
import { Save, CheckCircle2, Circle } from "lucide-react";
import {
  createEvaluationVideo,
  updateEvaluationVideo,
} from "@/actions/course/video/evaluations/video.evaluations";
import { toast } from "sonner";
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

    if (res?.success) {
      toast.success("Evaluación guardada correctamente");

      // <--- CAMBIO 3: Si se guardó bien, ejecutamos la función para avisarle al componente padre (CourseVideoManager)
      if (onSuccess) {
        onSuccess(data);
      }

      router.refresh();
    } else {
      toast.error(res?.error || "Error al guardar");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Lado Izquierdo: Pregunta */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 italic">
          Pregunta de la lección
        </label>
        <textarea
          value={data.question}
          onChange={(e) => setData({ ...data, question: e.target.value })}
          className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-sm font-bold text-white outline-none focus:border-[#FF6B00]/40 min-h-[180px] transition-all resize-none"
          placeholder="Escribe la pregunta para evaluar al alumno..."
        />
      </div>

      {/* Lado Derecho: Opciones */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 italic">
          Opciones (Marca la correcta)
        </label>

        <div className="space-y-3">
          {["A", "B", "C"].map((opt) => (
            <div key={opt} className="flex gap-3">
              <button
                onClick={() =>
                  setData({ ...data, correctOption: opt as "A" | "B" | "C" })
                }
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${
                  data.correctOption === opt
                    ? "bg-[#FF6B00] border-[#FF6B00] text-black shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                    : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"
                }`}
              >
                {data.correctOption === opt ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <span className="font-black italic">{opt}</span>
                )}
              </button>

              <input
                type="text"
                value={(data as any)[`option${opt}`]}
                onChange={(e) =>
                  setData({ ...data, [`option${opt}`]: e.target.value })
                }
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-6 text-xs font-bold text-white outline-none focus:border-[#FF6B00]/30 transition-all"
                placeholder={`Opción ${opt}...`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white hover:text-black py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all italic mt-6 disabled:opacity-50 group"
        >
          {loading ? (
            "Guardando..."
          ) : (
            <>
              <Save
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}
