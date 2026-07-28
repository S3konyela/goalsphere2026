const UPSTREAM = "https://api.kickoffapi.com";
const PREFIXES = ["/.netlify/functions/api-kickoff", "/api-kickoff"];

function stripPrefix(path) {
  for (const prefix of PREFIXES) {
    if (path.startsWith(prefix)) return path.slice(prefix.length) || "/";
  }
  return path;
}

exports.handler = async (event) => {
  const apiKey = process.env.KICKOFF_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing KICKOFF_KEY environment variable." }),
    };
  }

  const subPath = stripPrefix(event.path);
  const qs = new URLSearchParams(event.queryStringParameters || {}).toString();
  const url = `${UPSTREAM}${subPath}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
      body,
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
