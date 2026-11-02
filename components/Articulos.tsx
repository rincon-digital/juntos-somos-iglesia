"use client";
import { useEffect, useState } from "react";
import { getArticles } from "@/actions/articles/articles";
import { motion } from "framer-motion";
import { FileText, ArrowRight, User, Inbox, MessageCircle, Facebook, Instagram } from "lucide-react";
import { editorStyles } from "./admin/article/RichTextEditor";
import Link from "next/link";

interface ArticulosProps {
  onModalChange?: (isOpen: boolean) => void;
  limit?: number;
}

export default function Articulos({ onModalChange, limit }: ArticulosProps) {
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

  return (
    <section id="articulos" className="py-10 px-4 max-w-7xl mx-auto relative z-20">
      <style>{editorStyles}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="h-[2px] w-12 bg-[#FF6B00]" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C2410C]">
              Blog & Enseñanzas
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-[#0a0a0a]">
            Artículos
          </h2>
        </div>
      </div>

      {/* CONTENIDO / GRILLA */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(limit || 3)].map((_, i) => (
            <div
              key={i}
              className="h-[400px] bg-[#f5f5f4] rounded-[3rem] animate-pulse"
            />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <ArticleCard
              key={article.slug || article.id}
              article={article}
              idx={idx}
              previewText={getPreviewText(article.content)}
            />
          ))}
        </div>
      ) : (
        /* MENSAJE CUANDO NO HAY ARTÍCULOS */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-6 border border-[#e7e5e4] bg-[#f5f5f4] rounded-[3rem] text-center"
        >
          <div className="w-20 h-20 bg-[#f5f5f4] rounded-full flex items-center justify-center mb-6">
            <Inbox size={40} className="text-[#57534e]" />
          </div>
          <h3 className="text-2xl font-bold text-[#0a0a0a] mb-2 uppercase italic tracking-tighter">
            Próximamente más contenido
          </h3>
          <p className="text-[#57534e] max-w-sm text-sm font-medium">
            Estamos preparando nuevas enseñanzas y artículos para ti. Vuelve
            pronto para descubrir lo que tenemos preparado.
          </p>
        </motion.div>
      )}
    </section>
  );
}

// Subcomponente ArticleCard
function ArticleCard({ article, idx, previewText }: any) {
  const shareUrl = `https://jsioficial.com/articulos/${article.slug}`;
  const shareText = `Lee este artículo: ${article.title}`;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    instagram: `https://www.instagram.com/`, 
  };

  const handleShare = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Link href={`/articulos/${article.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: idx * 0.1 }}
        className="group cursor-pointer bg-white border border-[#e7e5e4] rounded-[3rem] overflow-hidden hover:border-[#FF6B00]/40 transition-all duration-500 flex flex-col h-[400px]"
      >
        <div className="relative h-[50%] w-full overflow-hidden bg-[#f5f5f4] flex items-center justify-center">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
            />
          ) : (
            <FileText
              size={40}
              className="text-[#d6d3d1] group-hover:text-[#C2410C]/50 transition-colors"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between relative z-10 -mt-6">
          <div>
            <span className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-[#C2410C] mb-3 bg-[#FF6B00]/10 px-3 py-1.5 rounded-full border border-[#FF6B00]/20">
              <User size={10} /> {article.author?.fullName || "Iglesia"}
            </span>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-[1.1] text-[#0a0a0a] group-hover:text-[#C2410C] transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-[10px] text-[#57534e] italic line-clamp-2 mt-2">
              {previewText}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#57534e] group-hover:text-[#0a0a0a] transition-colors">
              Leer Artículo{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-2 transition-transform"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => handleShare(e, shareLinks.whatsapp)}
                className="w-8 h-8 rounded-full bg-[#f5f5f4] border border-[#e7e5e4] flex items-center justify-center text-[#57534e] hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                title="Compartir en WhatsApp"
              >
                <MessageCircle size={14} />
              </button>
              <button 
                onClick={(e) => handleShare(e, shareLinks.facebook)}
                className="w-8 h-8 rounded-full bg-[#f5f5f4] border border-[#e7e5e4] flex items-center justify-center text-[#57534e] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                title="Compartir en Facebook"
              >
                <Facebook size={14} />
              </button>
              <button 
                onClick={(e) => handleShare(e, shareLinks.instagram)}
                className="w-8 h-8 rounded-full bg-[#f5f5f4] border border-[#e7e5e4] flex items-center justify-center text-[#57534e] hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-all"
                title="Ir a Instagram"
              >
                <Instagram size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
