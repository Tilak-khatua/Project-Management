import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useDispatch } from "react-redux";
import { fetchWorkspaces } from "../features/workspaceSlice";
import api from "../../configs/api.js";
import { Loader2Icon } from "lucide-react";

const CreateWorkspace = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = await getToken();
      
      // Generate slug from name if not provided
      const workspaceSlug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      // Create workspace directly via API (bypasses Clerk organization restrictions)
      const response = await api.post(
        "/api/workspaces/create",
        {
          name: formData.name,
          slug: workspaceSlug,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.workspace) {
        // Refresh workspaces to show the new one
        await dispatch(fetchWorkspaces({ getToken })).unwrap();
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error creating workspace:", err);
      setError(err.response?.data?.message || err.message || "Failed to create workspace. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-4 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-200">
            Create Your Workspace
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Get started by creating your first workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="workspace-name" className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-200">
                Workspace Name
              </label>
              <input
                id="workspace-name"
                name="workspace-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Workspace"
                autoComplete="organization"
                required
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="workspace-slug" className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-200">
                Workspace Slug (optional)
              </label>
              <input
                id="workspace-slug"
                name="workspace-slug"
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                placeholder="my-workspace"
                autoComplete="off"
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Leave empty to auto-generate from name
              </p>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="w-full py-2 px-4 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspace;

