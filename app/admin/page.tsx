"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, GraduationCap, MessageSquareQuote, PlusCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/auth";
import { getDashboardAnalytics, getCoursesWithCount } from "@/actions/admin/dashboard";
import { Role } from "@/lib/types/definitions";
import { toast } from "@/lib/toast";
import { AnimatedNumber, BarChart, ProgressBar, Ring, Sparkline } from "@/components/admin/DashboardCharts";

const VERSES = [
  { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Fil 4:13" },
  { text: "Sé los planes que tengo para vosotros, planes de bienestar y no de calamidad.", ref: "Jer 29:11" },
  { text: "El Señor es mi pastor; nada me faltará.", ref: "Sal 23:1" },
  { text: "Encomienda al Señor tus obras, y tus pensamientos serán afirmados.", ref: "Prov 16:3" },
  { text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.", ref: "Prov 3:5" },
  { text: "No os afanéis por nada; sean conocidas vuestras peticiones ante Dios.", ref: "Fil 4:6" },
  { text: "Buscad primeramente el reino de Dios y su justicia, y todo se os añadirá.", ref: "Mt 6:33" },
];

const getDailyVerse = () => VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];

type Analytics = Awaited<ReturnType<typeof getDashboardAnalytics>>;

const card = "rounded-[1.75rem] border border-[#e7e5e4] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]";

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] as const },
  }),
};

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
function timeAgo(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of steps) {
    if (Math.abs(diff) >= secs) return relative.format(Math.round(diff / secs), unit);
  }
  return "recién";
}

const ACTIVITY_ICON = {
  registration: { icon: GraduationCap, bg: "bg-[#fff7ed] text-[#C2410C]" },
  testimony: { icon: MessageSquareQuote, bg: "bg-[#f5f5f4] text-[#292524]" },
  article: { icon: FileText, bg: "bg-[#f5f5f4] text-[#292524]" },
  member: { icon: UserPlus, bg: "bg-[#ecfdf5] text-green-700" },
} as const;

function KpiCard({
  index,
  label,
  value,
  suffix,
  hint,
  spark,
  href,
}: {
  index: number;
  label: string;
  value: number | null;
  suffix?: string;
  hint: string;
  spark?: number[];
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-[#57534e]">{label}</p>
      <div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-semibold tracking-[-0.03em]">
            {value === null ? "—" : <AnimatedNumber value={value} suffix={suffix} />}
          </p>
          {spark && spark.some((v) => v > 0) && (
            <Sparkline values={spark} className="mb-1.5 h-7 w-16 shrink-0" />
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-[#57534e]">{hint}</p>
      </div>
    </>
  );
  const className = `${card} flex min-w-0 flex-col justify-between gap-4`;
  return (
    <motion.div custom={index} variants={reveal} initial="hidden" animate="visible" className="min-w-0">
      {href ? (
        <Link
          href={href}
          className={`${className} h-full outline-none transition-colors hover:border-[#d6d3d1] focus-visible:ring-2 focus-visible:ring-[#FF6B00]`}
        >
          {body}
        </Link>
      ) : (
        <div className={`${className} h-full`}>{body}</div>
      )}
    </motion.div>
  );
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  const router = useRouter();
  const verse = getDailyVerse();

  const loadData = async () => {
    try {
      const session = await getCurrentUser();
      if (!session) {
        router.push("/login-admin");
        return;
      }
      const [data, coursesData] = await Promise.all([getDashboardAnalytics(), getCoursesWithCount()]);
      setUser(session);
      setAnalytics(data);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("No se pudieron cargar las métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Todo el panel entra en la pantalla (escritorio): alto de la ventana menos el padding del layout
  const frame = "flex h-[calc(100svh-3.5rem)] min-h-[640px] flex-col gap-4 font-[family-name:var(--font-poppins)]";

  if (loading || !analytics) {
    return (
      <div className={frame} aria-busy="true">
        <div className="h-16 w-72 animate-pulse rounded-3xl bg-[#f5f5f4]" />
        <div className="grid grid-cols-6 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[1.75rem] bg-[#f5f5f4]" />
          ))}
        </div>
        <div className="flex-1 animate-pulse rounded-[1.75rem] bg-[#f5f5f4]" />
      </div>
    );
  }

  const { kpis, series, activity } = analytics;
  const isSuperAdmin = user?.role === Role.superadmin;
  const firstName = (user?.fullName || user?.username || "").split(" ")[0];
  const today = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  const totalStudents = courses.reduce((acc: number, c: any) => acc + c.studentCount, 0);
  const totalCupos = courses.reduce((acc: number, c: any) => acc + c.quotaLimit, 0);
  const occupancy = totalCupos > 0 ? Math.round((totalStudents / totalCupos) * 100) : 0;

  return (
    <div className={frame}>
      {/* ENCABEZADO */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#57534e] first-letter:uppercase">{today}</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Hola, {firstName} <span className="font-normal text-[#57534e]">· esto es lo que está pasando en la iglesia</span>
          </h1>
        </div>
        {isSuperAdmin && (
          <Link
            href="/admin/courses"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
          >
            <PlusCircle size={16} aria-hidden="true" />
            Crear curso
          </Link>
        )}
      </header>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-6 gap-4">
        <KpiCard index={0} label="Miembros" value={kpis.totalMembers} hint={`+${kpis.membersThisMonth} este mes`} spark={series.map((s) => s.members)} />
        <KpiCard index={1} label="Inscripciones" value={kpis.totalRegistrations} hint={`+${kpis.registrationsThisMonth} este mes`} spark={series.map((s) => s.registrations)} />
        <KpiCard index={2} label="Clases completadas" value={kpis.completedVideos} hint="Videos terminados" />
        <KpiCard
          index={3}
          label="Aciertos"
          value={kpis.accuracy}
          suffix="%"
          hint={kpis.answers > 0 ? `Sobre ${kpis.answers} respuestas` : "Sin respuestas aún"}
        />
        <KpiCard index={4} label="Testimonios" value={kpis.totalTestimonies} hint="Ver todos" href="/admin/testimony" />
        <KpiCard index={5} label="Artículos" value={kpis.totalArticles} hint="Ver todos" href="/admin/articles" />
      </div>

      {/* GRÁFICO, ACTIVIDAD, OCUPACIÓN Y PALABRA */}
      <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-2 gap-4">
        <motion.section custom={6} variants={reveal} initial="hidden" animate="visible" className={`${card} col-span-6 row-span-2 flex min-h-0 flex-col`}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em]">Crecimiento</h2>
              <p className="text-sm text-[#57534e]">Últimos 6 meses</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0a0a0a]" />Miembros nuevos</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#FF6B00]" />Inscripciones</span>
            </div>
          </div>
          {/* Resumen del mes */}
          <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-[#fafaf9] p-4">
            <div>
              <dt className="text-sm text-[#57534e]">Miembros nuevos este mes</dt>
              <dd className="text-2xl font-semibold tabular-nums tracking-[-0.02em]">
                {kpis.membersThisMonth}
                <span className="ml-2 text-sm font-normal text-[#57534e]">vs {kpis.membersPrevMonth} el mes pasado</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[#57534e]">Inscripciones este mes</dt>
              <dd className="text-2xl font-semibold tabular-nums tracking-[-0.02em]">
                {kpis.registrationsThisMonth}
                <span className="ml-2 text-sm font-normal text-[#57534e]">vs {kpis.registrationsPrevMonth} el mes pasado</span>
              </dd>
            </div>
          </dl>
          <div className="mt-auto h-full max-h-[240px] min-h-0 pt-6">
            <BarChart
              data={series}
              series={[
                { key: "members", label: "Miembros nuevos", color: "#0a0a0a" },
                { key: "registrations", label: "Inscripciones", color: "#FF6B00" },
              ]}
            />
          </div>
        </motion.section>

        <motion.section custom={7} variants={reveal} initial="hidden" animate="visible" className={`${card} col-span-3 row-span-2 flex min-h-0 flex-col`}>
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Actividad reciente</h2>
          {activity.length > 0 ? (
            <ul className="mt-2 min-h-0 flex-1 divide-y divide-[#e7e5e4] overflow-hidden">
              {activity.map((a, i) => {
                const { icon: Icon, bg } = ACTIVITY_ICON[a.type];
                return (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <time dateTime={a.date} className="shrink-0 text-xs text-[#57534e]">{timeAgo(a.date)}</time>
                      </div>
                      <p className="truncate text-sm text-[#57534e]">{a.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#57534e]">Todavía no hay actividad.</p>
          )}
        </motion.section>

        <motion.section custom={8} variants={reveal} initial="hidden" animate="visible" className={`${card} col-span-3 flex min-h-0 flex-col`}>
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Ocupación de cupos</h2>
          <div className="mt-3 flex min-h-0 flex-1 items-center gap-4">
            <Ring percent={occupancy} size={96} />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm text-[#57534e]">
                <span className="font-semibold tabular-nums text-[#0a0a0a]">{totalStudents}</span> de{" "}
                <span className="tabular-nums">{totalCupos}</span> cupos
              </p>
              {courses.slice(0, 2).map((c) => {
                const pct = c.quotaLimit > 0 ? Math.round((c.studentCount / c.quotaLimit) * 100) : 0;
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium capitalize">{c.name.toLowerCase()}</span>
                      <span className="shrink-0 tabular-nums text-[#57534e]">{pct}%</span>
                    </div>
                    <ProgressBar percent={pct} />
                  </div>
                );
              })}
              {courses.length > 2 && <p className="text-sm text-[#57534e]">+{courses.length - 2} cursos más</p>}
              {courses.length === 0 && <p className="text-sm text-[#57534e]">Todavía no hay cursos.</p>}
            </div>
          </div>
        </motion.section>

        <motion.figure custom={9} variants={reveal} initial="hidden" animate="visible" className="col-span-3 flex min-h-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[#FF6B00] p-5 text-black">
          <p className="text-sm font-medium">Palabra del día</p>
          <blockquote className="line-clamp-4 text-lg font-medium leading-snug tracking-[-0.01em]">“{verse.text}”</blockquote>
          <figcaption className="text-sm">{verse.ref}</figcaption>
        </motion.figure>
      </div>
    </div>
  );
}
