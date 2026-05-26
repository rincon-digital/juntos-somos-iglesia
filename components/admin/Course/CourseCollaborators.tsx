"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  addContributor, 
  removeContributor, 
  getAvailableUsers 
} from "@/actions/course/management/course.management";
import { UserIcon, Trash2, UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Manager {
  user: {
    id: string;
    fullName: string;
    username: string;
  };
}

interface CourseCollaboratorsProps {
  courseId: string;
  initialManagers: Manager[];
}

export default function CourseCollaborators({ 
  courseId, 
  initialManagers 
}: CourseCollaboratorsProps) {
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchAvailableUsers();
  }, [courseId]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    const res = await getAvailableUsers(courseId);
    if (Array.isArray(res)) {
      setAvailableUsers(res);
    }
    setLoadingUsers(false);
  };

  const handleAdd = () => {
    if (!selectedUserId) return;
    const userToAdd = availableUsers.find(u => u.id === selectedUserId);
    
    startTransition(async () => {
      const res = await addContributor(courseId, selectedUserId);
      if (res.success) {
        toast.success(res.success);
        if (userToAdd) {
          setManagers([...managers, { user: userToAdd }]);
          setAvailableUsers(availableUsers.filter(u => u.id !== selectedUserId));
        }
        setSelectedUserId("");
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const res = await removeContributor(courseId, userId);
      if (res.success) {
        toast.success(res.success);
        const removedManager = managers.find(m => m.user.id === userId);
        setManagers(managers.filter((m) => m.user.id !== userId));
        if (removedManager) {
          setAvailableUsers(prev => [...prev, removedManager.user].sort((a, b) => a.fullName.localeCompare(b.fullName)));
        }
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* SECCIÓN AÑADIR */}
      <div className="bg-[#0f0f0f] border border-white/[0.07] rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-xl flex items-center justify-center">
            <UserPlus size={20} className="text-[#FF6B00]" />
          </div>
          <h3 className="text-lg font-black uppercase italic text-white">
            Añadir <span className="text-[#FF6B00]">Colaborador</span>
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loadingUsers || isPending}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-[11px] font-bold uppercase text-white outline-none focus:border-[#FF6B00] appearance-none disabled:opacity-50"
            >
              <option value="" className="bg-[#0a0a0a]">-- SELECCIONAR USUARIO --</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id} className="bg-[#0a0a0a]">
                  {user.fullName} (@{user.username})
                </option>
              ))}
            </select>
            {loadingUsers && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-white/20" size={16} />
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedUserId || isPending}
            className="sm:w-32 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] hover:bg-[#FF6B00] hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="animate-spin" size={14} /> : "Añadir"}
          </button>
        </div>
      </div>

      {/* LISTA ACTUAL */}
      <div className="bg-[#0f0f0f] border border-white/[0.07] rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
            <UserIcon size={20} className="text-white/40" />
          </div>
          <h3 className="text-lg font-black uppercase italic text-white/60">
            Colaboradores <span className="text-white">Actuales</span>
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {managers.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold uppercase text-white/20 italic p-4 text-center border border-dashed border-white/10 rounded-2xl"
              >
                No hay colaboradores adicionales en este curso.
              </motion.p>
            ) : (
              managers.map((m) => (
                <motion.div
                  key={m.user.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF6B00]/5 border border-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-[#FF6B00]">
                      {m.user.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-white tracking-wider">
                        {m.user.fullName}
                      </p>
                      <p className="text-[9px] font-bold uppercase text-white/30">
                        @{m.user.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(m.user.id)}
                    disabled={isPending}
                    className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
