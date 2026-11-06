"use client";
import { useEffect, useState } from "react";
import { getArticles } from "@/actions/articles/articles";
import ArticleCard from "@/components/admin/article/ArticleCard";
import CreateArticle from "@/components/admin/article/CreateArticle";
import { Search } from "lucide-react";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="space-y-6 py-2 text-[#0a0a0a] font-[family-name:var(--font-poppins)]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Artículos</h1>
          <p className="mt-1 text-[#57534e]">
            {articles.length} {articles.length === 1 ? "publicado" : "publicados"} en la web. Tocá uno para leerlo o editarlo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <label htmlFor="buscar-articulo" className="sr-only">Buscar artículo</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]" size={16} aria-hidden="true" />
            <input
              id="buscar-articulo"
              type="search"
              placeholder="Buscar artículo…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-full border border-[#e7e5e4] bg-white pl-11 pr-4 text-sm outline-none transition-[border-color,box-shadow] hover:border-[#d6d3d1] focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#FF6B00]/30"
            />
          </div>
          <CreateArticle onRefresh={loadData} />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-3 gap-5" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[1.75rem] bg-[#f5f5f4]" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="rounded-[1.75rem] border border-[#e7e5e4] bg-white px-6 py-16 text-center">
          <p className="font-semibold">{searchQuery ? "No hay artículos con ese título" : "Todavía no hay artículos"}</p>
          <p className="mt-1 text-sm text-[#57534e]">
            {searchQuery ? "Probá con otra palabra." : "Publicá el primero con “Nuevo artículo”."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} onRefresh={loadData} />
          ))}
        </div>
      )}
    </div>
  );
}
