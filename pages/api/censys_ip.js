// pages/api/censys_ip.js

export default async function handler(req, res) {
  const { ip } = req.query;
  const censysApiUrl = `https://search.censys.io/api/v2/hosts/${ip}`;
  const censysApiId = process.env.CENSYS_API_ID;
  const censysApiSecret = process.env.CENSYS_API_SECRET;

  try {
    const response = await fetch(censysApiUrl, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${censysApiId}:${censysApiSecret}`).toString("base64"),
      },
    });

    if (!response.ok) {
      throw new Error(`Censys API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
