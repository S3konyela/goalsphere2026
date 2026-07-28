const UPSTREAM = "https://api.football-data.org/v4";
const PREFIXES = ["/.netlify/functions/football-data", "/api-fd"];

function stripPrefix(path) {
  for (const prefix of PREFIXES) {
    if (path.startsWith(prefix)) return path.slice(prefix.length) || "/";
  }
  return path;
}

exports.handler = async (event) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing FOOTBALL_DATA_API_KEY environment variable." }),
    };
  }

  const subPath = stripPrefix(event.path);
  const qs = new URLSearchParams(event.queryStringParameters || {}).toString();
  const url = `${UPSTREAM}${subPath}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
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
