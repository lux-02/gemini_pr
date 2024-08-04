// pages/api/censys_domain.js

export default async function handler(req, res) {
  const { domain } = req.query;

  // 쿼리 인코딩
  const encodedDomain = encodeURIComponent(domain);
  const censysApiUrl = `https://search.censys.io/api/v2/hosts/search?q=${encodedDomain}`;
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
      // API의 응답 코드와 상태 메시지를 클라이언트에 반환
      res.status(response.status).json({
        error: `Censys API error: ${response.statusText}`,
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    // 서버 오류에 대한 보다 구체적인 에러 메시지 반환
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}
