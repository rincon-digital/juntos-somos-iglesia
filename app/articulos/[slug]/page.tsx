import { Metadata, ResolvingMetadata } from "next";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  Share2, 
  MessageCircle, 
  Instagram, 
  Facebook,
  FileText
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editorStyles } from "@/components/admin/article/RichTextEditor";

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
      <p className="text-white/70 text-lg md:text-xl leading-relaxed whitespace-pre-wrap italic font-light">
        {html}
      </p>
    );
  }
  return (
    <div className="tiptap-editor prose prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
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

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-[#FF6B00] selection:text-white">
      <style>{editorStyles}</style>
      
      <Navbar />

      {/* HEADER DE NAVEGACIÓN */}
      <div className="pt-32 pb-10 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          href="/articulos"
          className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-[#FF6B00] transition-colors"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF6B00]/30 transition-colors">
            <ArrowLeft size={14} />
          </div>
          Volver al Blog
        </Link>

        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hidden md:block">
            Compartir artículo
           </span>
           <div className="flex gap-2">
              <a 
                href={shareLinks.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                title="Compartir en WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a 
                href={shareLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                title="Compartir en Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href={shareLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-pink-600/10 border border-pink-600/20 flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-all shadow-[0_0_15px_rgba(219,39,119,0.1)]"
                title="Ir a Instagram"
              >
                <Instagram size={18} />
              </a>
           </div>
        </div>
      </div>

      <article className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          
          {/* COLUMNA IZQUIERDA: IMAGEN Y METADATOS */}
          <div className="w-full md:w-5/12">
            <div className="sticky top-32 space-y-8">
              <div className="relative aspect-[4/5] w-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]">
                {article.imageUrl ? (
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <FileText size={120} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-60" />
              </div>

              <div className="flex flex-col gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center">
                    <User size={20} className="text-[#FF6B00]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest">Autor</p>
                    <p className="text-sm font-bold text-white">{article.author?.fullName || "Juntos Somos Iglesia"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Publicado</p>
                    <p className="text-sm font-bold text-white">{formatDate(article.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: CONTENIDO */}
          <div className="w-full md:w-7/12">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="h-[2px] w-12 bg-[#FF6B00]" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FF6B00]">
                  Lectura Recomendada
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-white">
                {article.title}
              </h1>
            </header>

            <div className="relative">
               {/* Comillas decorativas gigantes */}
               <span className="absolute -left-12 -top-12 text-[15rem] font-black text-white/[0.02] pointer-events-none select-none italic">
                “
               </span>
               
               <div className="relative z-10">
                <RichContent html={article.content} />
               </div>
            </div>

            {/* CTA FINAL / COMPARTIR */}
            <div className="mt-20 p-10 bg-[#FF6B00] rounded-[3rem] text-black relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125" />
               
               <div className="relative z-10">
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">
                   ¿Te gustó esta enseñanza?
                 </h3>
                 <p className="font-bold text-sm mb-8 max-w-md opacity-80 uppercase tracking-tight">
                   Ayúdanos a llegar a más personas compartiendo este mensaje con tus amigos y familiares.
                 </p>
                 
                 <div className="flex flex-wrap gap-4">
                    <a 
                      href={shareLinks.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                    <a 
                      href={shareLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white/20 backdrop-blur-md text-black border border-black/10 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all"
                    >
                      <Facebook size={16} /> Facebook
                    </a>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </article>

      <footer className="py-20 text-center border-t border-white/5 text-[10px] font-black tracking-[0.3em] uppercase text-white/20">
        © {new Date().getFullYear()} JUNTOS SOMOS IGLESIA — DIGITALIZA TU PASIÓN
      </footer>
    </main>
  );
}
