const UPSTREAM = "https://v3.football.api-sports.io";
const PREFIX = "/.netlify/functions/api-football";

exports.handler = async (event) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing API_FOOTBALL_KEY environment variable." }),
    };
  }

  const subPath = event.path.replace(PREFIX, "") || "/";
  const qs = new URLSearchParams(event.queryStringParameters || {}).toString();
  const url = `${UPSTREAM}${subPath}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
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
