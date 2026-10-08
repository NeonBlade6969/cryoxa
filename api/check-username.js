export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const username = String(req.query.username || "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({
      available: false,
      error:
        "Username must be 3–20 characters using letters, numbers, or underscores."
    });
  }

  const reserved = [
    "admin",
    "administrator",
    "support",
    "login",
    "signup",
    "register",
    "api",
    "root",
    "moderator",
    "official",
    "cryoxa",
    "settings",
    "contacts"
  ];

  if (reserved.includes(username)) {
    return res.status(200).json({ available: false });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      available: false,
      error: "Server configuration is incomplete."
    });
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/profiles?username=eq.${encodeURIComponent(
        username
      )}&select=username`,
      {
        method: "GET",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Supabase error:", response.status, errorText);

      return res.status(502).json({
        available: false,
        error: "Could not check username."
      });
    }

    const profiles = await response.json();

    return res.status(200).json({
      available: profiles.length === 0
    });
  } catch (error) {
    console.error("Username check error:", error);

    return res.status(500).json({
      available: false,
      error: "Unexpected server error."
    });
  }
}
