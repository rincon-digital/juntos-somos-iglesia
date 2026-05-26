"use client";
import { useEffect, useState } from "react";
import { getArticles } from "@/actions/articles/articles";
import ArticleCard from "@/components/admin/article/ArticleCard";
import CreateArticle from "@/components/admin/article/CreateArticle";
import { Search } from "lucide-react"; // Saqué el Plus porque ya está en CreateArticle

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado para el modal de lectura
  const [readingArticle, setReadingArticle] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getArticles();
    setArticles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full space-y-8 p-1">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
            Artículos
          </h2>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
            {articles.length} publicaciones editoriales
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors"
              size={15}
            />
            <input
              type="text"
              placeholder="BUSCAR ARTÍCULO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 transition-all"
            />
          </div>

          {/* ✅ ACÁ AGREGAMOS TU COMPONENTE REAL */}
          <CreateArticle onRefresh={loadData} />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5"
              />
            ))
          : filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setReadingArticle(article)}
                className="cursor-pointer"
              >
                <ArticleCard article={article} onRefresh={loadData} />
              </div>
            ))}
      </div>
    </div>
  );
}
