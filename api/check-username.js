export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      available: false,
      error: "Method not allowed"
    });
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

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      available: false,
      error: "Server configuration is incomplete."
    });
  }

  try {
    // Check reserved usernames
    const reservedResponse = await fetch(
      `${url}/rest/v1/reserved_usernames?username=eq.${encodeURIComponent(username)}&select=username`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      }
    );

    if (!reservedResponse.ok) {
      console.error(
        "Reserved username check failed:",
        await reservedResponse.text()
      );

      return res.status(502).json({
        available: false,
        error: "Could not check username."
      });
    }

    const reserved = await reservedResponse.json();

    if (reserved.length > 0) {
      return res.status(200).json({
        available: false
      });
    }

    // Check existing profiles
    const profileResponse = await fetch(
      `${url}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=username`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      }
    );

    if (!profileResponse.ok) {
      console.error(
        "Profile username check failed:",
        await profileResponse.text()
      );

      return res.status(502).json({
        available: false,
        error: "Could not check username."
      });
    }

    const profiles = await profileResponse.json();

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
