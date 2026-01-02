/* =========================================================
   Types
   ========================================================= */
export type TreeNode = {
  name: string;
  type: "folder" | "file";
  path?: string;
  content?: string;
  children?: TreeNode[];
};

/* =========================================================
   Config
   ========================================================= */
const GITLAB_API_URL = "https://git.skillryt.com/api/v4";
const GITLAB_TOKEN = process.env.GITLAB_TOKEN!;

const SKIP_DIRS = ["node_modules", ".git", ".next", "dist", "build"];
const MAX_FILE_SIZE = 1_000_000; // 1 MB

/* =========================================================
   Resolve project (ID, path + default branch)
   ========================================================= */
async function resolveProject(owner: string, repo: string) {
  const headers: Record<string, string> = {};
  if (GITLAB_TOKEN) {
    headers["PRIVATE-TOKEN"] = GITLAB_TOKEN;
  }

  const res = await fetch(
    `${GITLAB_API_URL}/projects?search=${repo}&simple=true`,
    { headers }
  );

  if (!res.ok) throw new Error("Project search failed");

  const projects = await res.json();

  const project = projects.find(
    (p: any) => p.path_with_namespace === `${owner}/${repo}`
  );

  if (!project) throw new Error("Project not found");

  console.log("Resolved project", { owner, repo, id: project.id, path: project.path_with_namespace, branch: project.default_branch || "main" });

  return {
    id: project.id,
    path: project.path_with_namespace,
    branch: project.default_branch || "main",
  };
}

/* =========================================================
   Public API
   ========================================================= */
export async function fetchGitLabTree(owner: string, repo: string): Promise<TreeNode> {
  const { id, path, branch } = await resolveProject(owner, repo);

  const rootItems = await fetchDirectory(id, "", branch);
  const children = await buildTree(id, path, branch, rootItems);

  return {
    name: repo,
    type: "folder",
    children,
  };
}

/* =========================================================
   Build tree recursively
   ========================================================= */
async function buildTree(
  projectId: number,
  projectPath: string,
  branch: string,
  items: any[]
): Promise<TreeNode[]> {
  const nodes = await Promise.all(
    items.map(async (item) => {
      if (shouldSkip(item.path)) return null;

      // 📁 Folder
      if (item.type === "tree") {
        console.log("Building tree for folder", { name: item.name, path: item.path });
        const children = await buildTree(
          projectId,
          projectPath,
          branch,
          await fetchDirectory(projectId, item.path, branch)
        );

        return {
          name: item.name,
          type: "folder",
          children,
        };
      }

      // 📄 File
      if (item.type === "blob") {
        if (item.size > MAX_FILE_SIZE) {
          console.log("Skipping large file", { name: item.name, size: item.size });
          return {
            name: item.name,
            type: "file",
            path: item.path,
            content: "[Skipped: Large file]",
          };
        }

        console.log("Fetching content for file", { name: item.name, path: item.path });
        const content = await fetchFileContent(
          projectId,
          item.id
        );

        return {
          name: item.name,
          type: "file",
          path: item.path,
          content,
        };
      }

      return null;
    })
  );

  return nodes.filter(Boolean) as TreeNode[];
}

/* =========================================================
   Directory API
   ========================================================= */
async function fetchDirectory(
  projectId: number,
  path: string,
  branch: string
) {
  const headers: Record<string, string> = {};
  if (GITLAB_TOKEN) {
    headers["PRIVATE-TOKEN"] = GITLAB_TOKEN;
  }

  const url =
    `${GITLAB_API_URL}/projects/${projectId}/repository/tree?ref=${encodeURIComponent(branch)}` +
    (path ? `&path=${encodeURIComponent(path)}` : "");

  console.log("Fetching directory", { projectId, path, branch, url });

  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.error("❌ Tree fetch failed", { url, status: res.status });
    throw new Error("Tree fetch failed");
  }

  return res.json();
}

/* =========================================================
   File content (using blob API)
   ========================================================= */
async function fetchFileContent(
  projectId: number,
  sha: string
): Promise<string> {
  const headers: Record<string, string> = {};
  if (GITLAB_TOKEN) {
    headers["PRIVATE-TOKEN"] = GITLAB_TOKEN;
  }

  const url = `${GITLAB_API_URL}/projects/${projectId}/repository/blobs/${sha}`;

  console.log("Fetching file content", { projectId, sha, url });

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 404) {
      console.error("File not found", { sha });
      return "[File not found]";
    } else {
      console.error("❌ File fetch failed", {
        sha,
        status: res.status,
      });
      return "[Error fetching file]";
    }
  }

  const json = await res.json();

  if (json.encoding === "base64" && json.content) {
    const decoded = Buffer.from(json.content, "base64").toString("utf-8");
    console.log("Successfully fetched file content", { sha, contentLength: decoded.length });
    return decoded;
  }

  console.warn("Unsupported file encoding", { sha, encoding: json.encoding });
  return "[Unsupported file encoding]";
}

/* =========================================================
   Utils
   ========================================================= */
function shouldSkip(path: string) {
  return SKIP_DIRS.some((d) => path.startsWith(d));
}
