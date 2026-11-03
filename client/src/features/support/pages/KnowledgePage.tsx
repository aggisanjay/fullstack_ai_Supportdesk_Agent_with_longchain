import { BookOpen, Plus, Trash2, Edit3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupport } from "../supportCtx";

export default function KnowledgePage() {
  const {
    filteredKbArticles, kbFilter, kbLoading, kbSearch, openArticleModal, setDeleteConfirmId, setKbFilter, setKbSearch,
  } = useSupport();
  return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242838] pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-[#f4f1ea] tracking-tight">Knowledge Base Workspace</h1>
            <p className="text-xs text-[#a3a8bb] mt-1">
              Manage runbooks, documentation, and troubleshooting guides used for vector grounding.
            </p>
          </div>
          <Button
            onClick={() => openArticleModal()}
            size="sm"
            className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#05060a] font-bold text-xs rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Article</span>
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#767c92]" />
            <input
              type="text"
              value={kbSearch}
              onChange={(e) => setKbSearch(e.target.value)}
              placeholder="Search articles by title or keyword..."
              className="w-full saas-input rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#f4f1ea] placeholder:text-[#767c92]"
            />
          </div>

          <select
            value={kbFilter}
            onChange={(e) => setKbFilter(e.target.value)}
            className="custom-select saas-input text-xs font-semibold rounded-xl py-2.5 pl-3 pr-8 text-[#f4f1ea] cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="faq">FAQ</option>
            <option value="documentation">Product Documentation</option>
            <option value="internal">Internal Runbooks</option>
            <option value="troubleshooting">Troubleshooting Guides</option>
          </select>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {kbLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : filteredKbArticles.length === 0 ? (
            <div className="saas-card rounded-2xl p-12 text-center text-[#767c92] space-y-2">
              <BookOpen className="h-8 w-8 mx-auto text-[#323852]" />
              <div className="font-semibold text-sm text-[#f4f1ea]">No articles found</div>
              <p className="text-xs text-[#a3a8bb]">Try adjusting your search query or upload a new runbook.</p>
            </div>
          ) : (
            filteredKbArticles.map((art) => (
              <div key={art.id} className="saas-card rounded-2xl p-5 space-y-3 relative group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="category">{art.category}</Badge>
                      <span className="text-[10px] font-mono text-[#767c92]">{art.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#f4f1ea] mt-2">{art.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openArticleModal(art)}
                      className="p-1.5 rounded-lg text-[#a3a8bb] hover:text-[#f4f1ea] hover:bg-[#151826] transition cursor-pointer"
                      title="Edit article"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(art.id)}
                      className="p-1.5 rounded-lg text-[#a3a8bb] hover:text-[#ff8a7e] hover:bg-[#ff4d3d1f] transition cursor-pointer"
                      title="Delete article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#a3a8bb] leading-relaxed whitespace-pre-wrap">
                  {art.content}
                </p>

                <div className="pt-2 border-t border-[#242838] flex items-center justify-between text-[10px] text-[#767c92] font-mono">
                  <span>Indexed on {new Date(art.createdAt).toLocaleDateString()}</span>
                  {art.updatedAt && (
                    <span>Last updated {new Date(art.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  );
}
