"use client";
import { useEffect, useRef, useState } from "react";
import { getArticles } from "@/actions/articles/articles";
import { motion } from "framer-motion";
import Link from "next/link";

interface ArticulosProps {
  onModalChange?: (isOpen: boolean) => void;
  limit?: number;
}

// Hoy el admin solo sube imágenes; si algún día llega un video, se muestra su primer cuadro
const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

export default function Articulos({ limit }: ArticulosProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const data = await getArticles(limit);
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, [limit]);

  const getPreviewText = (html: string) => {
    return html
      ?.replace(/<\/h1>|<\/h2>|<\/p>|<\/li>/g, " ")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  // Con cantidad impar, el primero ocupa todo el ancho para que la grilla cierre pareja
  const featureFirst = articles.length % 2 === 1;

  return (
    <section
      id="articulos"
      className="relative z-20 scroll-mt-12 px-6 py-24 text-[#0a0a0a] font-[family-name:var(--font-poppins)]"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-xl">
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Artículos
          </h2>
          <p className="mt-3 text-base text-[#57534e]">
            Enseñanzas y noticias de nuestra iglesia.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[...Array(limit && limit < 3 ? limit : 2)].map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-[2rem] bg-[#f5f5f4] sm:aspect-[16/10]"
              />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {articles.map((article, idx) => (
              <ArticleCard
                key={article.slug || article.id}
                article={article}
                idx={idx}
                featured={featureFirst && idx === 0}
                previewText={getPreviewText(article.content)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#e7e5e4] px-6 py-16 text-center">
            <h3 className="text-xl font-semibold">Todavía no hay artículos</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#57534e]">
              Estamos preparando nuevas enseñanzas. Volvé pronto.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ArticleCard({ article, idx, featured, previewText }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const media: string | null = article.imageUrl || null;
  const isVideo = media ? isVideoUrl(media) : false;
  const date = new Date(article.createdAt).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className={featured ? "lg:col-span-2" : ""}
    >
      <Link
        href={`/articulos/${article.slug}`}
        onMouseEnter={() => videoRef.current?.play().catch(() => {})}
        onMouseLeave={() => videoRef.current?.pause()}
        className={`group relative block aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#0a0a0a] text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 sm:aspect-[16/10] ${
          featured ? "lg:aspect-[21/9]" : ""
        }`}
      >
        {media ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={`${media}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              src={media}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          )
        ) : (
          <img
            src="/Logo.webp"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-16 -right-16 w-72 opacity-[0.12]"
          />
        )}

        {/* Legibilidad arriba y desenfoque progresivo abajo, como en la referencia */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/75 via-black/35 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_top,black_40%,transparent)]" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-6 text-sm md:px-8">
          <span className="font-semibold">Juntos Somos Iglesia</span>
          <time dateTime={article.createdAt} className="text-white/90">
            {date}
          </time>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-end sm:justify-between md:p-8">
          <div className="max-w-xl">
            <h3 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.02em] text-balance md:text-3xl">
              {article.title}
            </h3>
            {previewText && (
              <p className="mt-2 line-clamp-2 text-sm text-white/85 md:text-base">
                {previewText}
              </p>
            )}
          </div>
          <span className="inline-flex h-11 shrink-0 items-center rounded-full border border-white/25 bg-white/20 px-5 text-sm font-medium backdrop-blur-md transition-colors duration-200 group-hover:bg-white/30">
            Leer más
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
