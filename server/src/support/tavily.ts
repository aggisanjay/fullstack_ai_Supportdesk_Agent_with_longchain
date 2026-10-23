export type TavilyResult = {
  title: string;
  url: string;
  snippet: string;
};

function isValidWebUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function tavilySearch(args: {
  query: string;
}): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const extractQuery = args.query.trim();
  if (!extractQuery) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout guard

  try {
    const result = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: key,
        query: extractQuery,
        max_results: 3,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!result.ok) return [];

    const data = (await result.json()) as unknown as {
      results?: Array<{
        title?: unknown;
        url?: unknown;
        content?: unknown;
      }>;
    };

    const results = Array.isArray(data.results) ? data.results : [];

    return results
      .map((res) => {
        const title = typeof res.title === "string" ? res.title.trim() : "External Reference";
        const url = typeof res.url === "string" ? res.url.trim() : "";
        const content = typeof res.content === "string" ? res.content : "";

        return {
          title: title || "External Documentation",
          url,
          snippet: content.slice(0, 350),
        };
      })
      .filter((filteredRes) => isValidWebUrl(filteredRes.url));
  } catch (e) {
    clearTimeout(timeoutId);
    return [];
  }
}
