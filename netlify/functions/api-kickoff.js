const UPSTREAM = "https://api.kickoffapi.com";
const PREFIX = "/.netlify/functions/api-kickoff";

exports.handler = async (event) => {
  const apiKey = process.env.KICKOFF_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing KICKOFF_KEY environment variable." }),
    };
  }

  const subPath = event.path.replace(PREFIX, "") || "/";
  const qs = new URLSearchParams(event.queryStringParameters || {}).toString();
  const url = `${UPSTREAM}${subPath}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
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
