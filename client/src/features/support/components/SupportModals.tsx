/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API payloads, validated server side */
import { Trash2, Loader2, Sparkles, Cpu, ChevronRight, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SAMPLE_PRESETS } from "../constants";
import { useSupport } from "../supportCtx";

export default function SupportModals() {
  const {
    actionLoading, articleForm, articleFormError, autoRunAiOnCreate, deleteConfirmId, editingArticle, handleCreateTicket, handleDeleteArticle, handleResetData, handleSaveArticle, isArticleModalOpen, isNewTicketModalOpen, isResetModalOpen, newTicketForm, newTicketProvider, resetOption, setArticleForm, setAutoRunAiOnCreate, setDeleteConfirmId, setIsArticleModalOpen, setIsNewTicketModalOpen, setIsResetModalOpen, setNewTicketForm, setNewTicketProvider, setResetOption, } = useSupport();
  return (
    <>
    {/* Article Create / Edit Modal */}
    <Modal
      isOpen={isArticleModalOpen}
      onClose={() => setIsArticleModalOpen(false)}
      title={editingArticle ? "Edit Knowledge Base Article" : "Create Knowledge Base Article"}
      description="Indexed immediately for vector cosine similarity matching during agent triage."
    >
      <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
        {articleFormError && (
          <div className="p-2.5 bg-[#ff4d3d1f] border border-[#ff4d3d40] rounded-xl text-xs text-[#ff8a7e] font-medium">
            {articleFormError}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
            Article Title
          </label>
          <input
            type="text"
            value={articleForm.title}
            onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
            placeholder="e.g. OAuth Redirect URI Setup & Common Mismatches"
            className="w-full saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={articleForm.category}
            onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value as any })}
            className="custom-select w-full saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea] cursor-pointer"
          >
            <option value="faq">FAQ</option>
            <option value="documentation">Product Documentation</option>
            <option value="internal">Internal Runbook</option>
            <option value="troubleshooting">Troubleshooting Guide</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
            Article Content & Guidelines
          </label>
          <textarea
            value={articleForm.content}
            onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
            placeholder="Detailed runbook guidance, config keys, error resolution steps..."
            className="w-full min-h-32 saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea] resize-y leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#242838]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsArticleModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#05060a] font-bold"
          >
            {editingArticle ? "Save Changes" : "Create Article"}
          </Button>
        </div>
      </form>
    </Modal>

    {/* Delete Confirmation Modal */}
    <Modal
      isOpen={!!deleteConfirmId}
      onClose={() => setDeleteConfirmId(null)}
      title="Confirm Article Deletion"
      description="Are you sure you want to permanently remove this article from the knowledge base?"
    >
      <div className="space-y-4 text-xs">
        <p className="text-[#a3a8bb]">
          Once deleted, this document will no longer be available for vector cosine similarity retrieval in automated agent triage.
        </p>
        <div className="flex justify-end gap-2 pt-2 border-t border-[#242838]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDeleteArticle}
          >
            Delete Article
          </Button>
        </div>
      </div>
    </Modal>

    {/* Reset Confirmation Modal */}
    <Modal
      isOpen={isResetModalOpen}
      onClose={() => setIsResetModalOpen(false)}
      title="Reset & Clear Support Data"
      description="Choose how you want to reset ticket data to test generation from start."
    >
      <div className="space-y-4 text-xs">
        <p className="text-[#a3a8bb]">
          You can restore clean baseline seed tickets with pre-computed telemetry and step-by-step journeys, or wipe the ticket queue completely to start with a blank slate.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setResetOption("seed")}
            className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
              resetOption === "seed"
                ? "bg-[#ff6b0a1a] border-[#FF6B0A] shadow-xs"
                : "bg-[#0e1018] border-[#242838] hover:bg-[#07080d]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-4 w-4 text-[#FF6B0A]" />
              <span className="font-bold text-[#f4f1ea]">Clean Seed Data</span>
            </div>
            <p className="text-[11px] text-[#a3a8bb] leading-snug">
              Restores 3 clean realistic tickets with full step-by-step telemetry, latency tracking, and cost calculation.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setResetOption("wipe")}
            className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
              resetOption === "wipe"
                ? "bg-[#ff4d3d1f] border-[#ff8a7e] shadow-xs"
                : "bg-[#0e1018] border-[#242838] hover:bg-[#07080d]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="h-4 w-4 text-[#ff8a7e]" />
              <span className="font-bold text-[#f4f1ea]">Blank Slate</span>
            </div>
            <p className="text-[11px] text-[#a3a8bb] leading-snug">
              Completely clears all tickets and telemetry logs. Ideal for generating tickets purely from scratch.
            </p>
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#242838]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsResetModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleResetData(resetOption === "wipe")}
            disabled={actionLoading}
            className={resetOption === "wipe" ? "bg-[#ff8a7e] hover:bg-[#ff8a7e] text-[#0e1018] font-bold" : "bg-[#FF6B0A] hover:bg-[#E85B00] text-[#05060a] font-bold"}
          >
            {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            <span>{resetOption === "wipe" ? "Wipe All Tickets" : "Restore Clean Seed Data"}</span>
          </Button>
        </div>
      </div>
    </Modal>

    {/* New Ticket Modal with Presets & Auto-Run AI Pipeline */}
    <Modal
      isOpen={isNewTicketModalOpen}
      onClose={() => setIsNewTicketModalOpen(false)}
      title="Create Ticket & Run AI Pipeline"
      description="Register a support inquiry and generate a context-grounded AI copilot proposal with live telemetry."
    >
      <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          
        {/* One-Click Presets */}
        <div>
          <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Zap className="h-3 w-3 text-[#FF6B0A]" />
            <span>Quick Test Presets (Click to autofill)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNewTicketForm({
                    title: preset.title,
                    customerName: preset.customerName,
                    customerEmail: preset.customerEmail,
                    text: preset.text,
                  });
                }}
                className="p-2 text-left rounded-lg bg-[#07080d] hover:bg-[#ff6b0a1a] border border-[#242838] hover:border-[#ff6b0a4d] transition text-[11px] font-semibold text-[#f4f1ea] cursor-pointer flex items-center justify-between"
              >
                <span className="truncate">{preset.label}</span>
                <ChevronRight className="h-3 w-3 text-[#FF6B0A] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
            Ticket Subject
          </label>
          <input
            type="text"
            value={newTicketForm.title}
            onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
            placeholder="e.g. Scalekit OAuth redirect_uri_mismatch error on callback"
            className="w-full saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={newTicketForm.customerName}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
              placeholder="Alice Johnson"
              className="w-full saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
              Customer Email
            </label>
            <input
              type="email"
              value={newTicketForm.customerEmail}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
              placeholder="alice@example.com"
              className="w-full saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#767c92] uppercase tracking-wider mb-1">
            Customer Message
          </label>
          <textarea
            value={newTicketForm.text}
            onChange={(e) => setNewTicketForm({ ...newTicketForm, text: e.target.value })}
            placeholder="Detailed customer inquiry or technical issue description..."
            className="w-full min-h-24 saas-input rounded-xl p-2.5 text-xs text-[#f4f1ea] resize-y"
            required
          />
        </div>

        {/* Engine Selector & Auto-Run Checkbox */}
        <div className="p-3 bg-[#07080d] rounded-xl border border-[#242838] space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-[#f4f1ea] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-[#FF6B0A]" />
              <span>AI Synthesis Engine</span>
            </span>
            <select
              value={newTicketProvider}
              onChange={(e) => setNewTicketProvider(e.target.value as any)}
              className="custom-select saas-input text-xs font-semibold rounded-lg py-1 px-2.5 text-[#f4f1ea] cursor-pointer"
            >
              <option value="gemini">Google Gemini 1.5 Flash</option>
              <option value="groq">Groq (LLaMA-3.3-70B)</option>
              <option value="openai">OpenAI GPT-4o-mini</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#242838]/80">
            <input
              type="checkbox"
              checked={autoRunAiOnCreate}
              onChange={(e) => setAutoRunAiOnCreate(e.target.checked)}
              className="rounded text-[#FF6B0A] focus:ring-[#FF6B0A] h-4 w-4 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-[#f4f1ea]">
              Run full AI pipeline immediately & stream step-by-step response
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#242838]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsNewTicketModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={actionLoading}
            className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#05060a] font-bold flex items-center gap-1.5"
          >
            {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{autoRunAiOnCreate ? "Create & Run AI Pipeline" : "Register Ticket"}</span>
          </Button>
        </div>
      </form>
    </Modal>

  
    </>
  );
}
