import { useState } from "react";
import { FolderGit2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitProjectEvidence } from "@/lib/project-server";

// ---------------------------------------------------------------------------
// Project Evidence Submission Form (shared)
//
// Used by:
//   - Skill Assessments page (Projects / Project Evidence tab)
//   - My Projects page (Submit Project Evidence)
//
// Submits through submitProjectEvidence() from src/lib/project-server.ts,
// which authenticates the student server-side and persists a ProjectSubmission
// row with status SUBMITTED. URLs are optional and stored as null when empty.
// ---------------------------------------------------------------------------

export function ProjectSubmissionForm({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [title, setTitle] = useState("");
  const [skillName, setSkillName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !skillName.trim() || !description.trim()) {
      setError("Please fill in project title, target skill, and description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitProjectEvidence({
        data: {
          title,
          skillName,
          description,
          repoUrl,
          projectUrl,
          evidenceText,
        },
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message || "Failed to submit project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Submit Project Evidence</h3>
              <p className="text-xs text-white/60">Tier 3 Practical Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/60 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-white/70 font-semibold mb-1">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Task Queue with Redis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Target Skill *</label>
            <input
              type="text"
              required
              placeholder="e.g. Python, Docker, PostgreSQL, React"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Description & Architecture *</label>
            <textarea
              rows={3}
              required
              placeholder="Describe what you built, libraries used, architectural decisions, and key technical challenges solved."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Repository URL (GitHub/GitLab)</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/70 font-semibold mb-1">Live Demo / Deployment URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Evidence / Contribution</label>
            <textarea
              rows={3}
              placeholder="Describe your specific contribution: what you implemented, your role, key decisions, and how this project demonstrates the skill."
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-white/10 text-white/80 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white hover:brightness-110 shadow-lg shadow-purple-500/20"
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
