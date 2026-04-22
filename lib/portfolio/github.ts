export type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  topics: string[];
  stars: number;
  language: string | null;
  pushedAt: string;
};

type RawRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
};

// Repos to hide from the public index (meta / sensitive / test)
const HIDDEN = new Set(['afvr94']);

export async function fetchRepos(username = 'afvr94'): Promise<GithubRepo[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
    {
      headers,
      // Rebuild at most every 30 minutes; falls back to stale on failure
      next: { revalidate: 1800 },
    }
  );

  if (!res.ok) {
    console.error(`GitHub API ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = (await res.json()) as RawRepo[];

  return data
    .filter((r) => !r.fork && !r.archived && !r.private && !HIDDEN.has(r.name))
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      url: r.html_url,
      homepage: r.homepage,
      topics: r.topics ?? [],
      stars: r.stargazers_count,
      language: r.language,
      pushedAt: r.pushed_at,
    }));
}
