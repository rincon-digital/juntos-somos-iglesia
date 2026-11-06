import { Metadata, ResolvingMetadata } from "next";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { Calendar, User, ArrowLeft, MessageCircle, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

// 1. GENERACIÓN DE METADATA DINÁMICA (SEO & SOCIAL)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = (await params).slug;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: { select: { fullName: true } } }
  });

  if (!article) return { title: "Artículo no encontrado" };

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: article.title,
    description: article.content.replace(/<[^>]*>/g, "").substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.content.replace(/<[^>]*>/g, "").substring(0, 160),
      images: article.imageUrl ? [article.imageUrl, ...previousImages] : previousImages,
      type: "article",
      authors: [article.author?.fullName || "Juntos Somos Iglesia"],
      publishedTime: article.createdAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.content.replace(/<[^>]*>/g, "").substring(0, 160),
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

function RichContent({ html }: { html: string }) {
  const isHtml = html?.startsWith("<");
  if (!isHtml) {
    return (
      <p className="whitespace-pre-wrap text-lg leading-relaxed text-[#44403c]">
        {html}
      </p>
    );
  }
  // article-body (globals.css) da estilos claros; tiptap-editor queda para el editor oscuro del admin
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default async function ArticleDetailPage({ params }: Props) {
  const slug = (await params).slug;
  
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: {
        select: { fullName: true, role: true }
      }
    }
  });

  if (!article) notFound();

  const shareUrl = `https://jsioficial.com/articulos/${article.slug}`;
  const shareText = `Lee este artículo: ${article.title}`;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    // Instagram no permite compartir links directos vía URL, redirigimos a una guía o simplemente mostramos el icono
    instagram: `https://www.instagram.com/`, 
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const shareButton =
    "flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e5e4] bg-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2";

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a] selection:bg-[#FF6B00] selection:text-black font-[family-name:var(--font-poppins)]">
      <Navbar />

      {/* NAVEGACIÓN Y COMPARTIR */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pb-10 pt-32">
        <Link
          href="/#articulos"
          className="group inline-flex h-11 items-center gap-2 rounded-full border border-[#e7e5e4] pl-2 pr-5 text-sm font-medium transition-colors duration-200 hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f4] transition-colors group-hover:bg-white">
            <ArrowLeft size={16} aria-hidden="true" />
          </span>
          Volver a artículos
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[#57534e] md:block">Compartir</span>
          <div className="flex gap-2">
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en WhatsApp"
              className={`${shareButton} text-green-700 hover:border-green-700 hover:bg-green-50`}
            >
              <MessageCircle size={18} aria-hidden="true" />
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en Facebook"
              className={`${shareButton} text-blue-700 hover:border-blue-700 hover:bg-blue-50`}
            >
              <Facebook size={18} aria-hidden="true" />
            </a>
            <a
              href={shareLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ir a Instagram"
              className={`${shareButton} text-pink-700 hover:border-pink-700 hover:bg-pink-50`}
            >
              <Instagram size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col gap-12 md:flex-row lg:gap-16">
          {/* COLUMNA IZQUIERDA: IMAGEN Y DATOS */}
          <div className="w-full md:w-5/12">
            <div className="sticky top-32 space-y-6">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#0a0a0a] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/Logo.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -bottom-16 -right-16 w-72 opacity-[0.12]"
                  />
                )}
              </div>

              <dl className="flex flex-col gap-5 rounded-[1.75rem] border border-[#e7e5e4] p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-[#C2410C]">
                    <User size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm text-[#57534e]">Autor</dt>
                    <dd className="font-medium">{article.author?.fullName || "Juntos Somos Iglesia"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-[#57534e]">
                    <Calendar size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-sm text-[#57534e]">Publicado</dt>
                    <dd className="font-medium">
                      <time dateTime={article.createdAt.toISOString()}>{formatDate(article.createdAt)}</time>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* COLUMNA DERECHA: CONTENIDO */}
          <div className="w-full md:w-7/12">
            <h1 className="mb-8 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance lg:text-6xl">
              {article.title}
            </h1>

            <RichContent html={article.content} />

            {/* COMPARTIR AL FINAL */}
            <div className="mt-16 rounded-[2rem] bg-[#FF6B00] p-8 text-black md:p-10">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">¿Te gustó esta enseñanza?</h2>
              <p className="mt-2 max-w-md">
                Compartila con tus amigos y familiares para que llegue a más personas.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white transition-[transform,background-color] duration-200 hover:bg-[#292524] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF6B00]"
                >
                  <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                </a>
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black transition-[transform,background-color] duration-200 hover:bg-[#f5f5f4] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF6B00]"
                >
                  <Facebook size={16} aria-hidden="true" /> Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-[#e7e5e4] py-12 text-center text-sm text-[#57534e]">
        © {new Date().getFullYear()} Juntos Somos Iglesia
      </footer>
    </main>
  );
}
