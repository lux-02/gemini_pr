import cheerio from "cheerio";
import quotedPrintable from "quoted-printable";
import iconv from "iconv-lite";

export default function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { rawEmailData } = req.body;
      if (typeof rawEmailData !== "string" || rawEmailData.trim() === "") {
        throw new Error("Email data is empty or not a valid string.");
      }
      const { body, links } = parseEmailData(rawEmailData);
      res.status(200).json({ body, links });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({
        error: "Error processing email data",
        details: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function parseEmailData(rawEmailData) {
  const contentTypePattern =
    /Content-Type: text\/(plain|html);\s*charset=["']?([^"';\s]+)["']?/gi;
  let charset = "utf-8";
  let body = "Could not extract the email body.";
  let emailLinks = [];

  Array.from(rawEmailData.matchAll(contentTypePattern)).forEach((match) => {
    charset = match[2]?.toLowerCase() ?? "utf-8";
    const encodingMatch = rawEmailData.match(
      /Content-Transfer-Encoding: (quoted-printable|base64)/i
    );
    let encodingType = encodingMatch ? encodingMatch[1].toLowerCase() : null;

    const bodyStartIndex = rawEmailData.indexOf("\n\n", match.index);
    if (bodyStartIndex !== -1) {
      let encodedBody = rawEmailData.substring(bodyStartIndex).trim();
      let decodedBody;
      if (encodingType === "base64") {
        decodedBody = iconv.decode(Buffer.from(encodedBody, "base64"), charset);
      } else if (encodingType === "quoted-printable") {
        decodedBody = iconv.decode(
          quotedPrintable.decode(encodedBody),
          charset
        );
      } else {
        decodedBody = encodedBody;
      }

      if (match[1].toLowerCase() === "html") {
        const $ = cheerio.load(decodedBody);
        body = $("body").text().trim() || decodedBody;
        emailLinks = extractLinksFromHtml($);
      } else {
        body = decodedBody.replace(/<br\/>/g, "\n");
        emailLinks = extractLinksFromPlainText(decodedBody);
      }
    }
  });

  return { body, links: emailLinks };
}

function cleanURL(url) {
  if (typeof url !== "string") return "";
  url = url.replace(/>$/, "");
  try {
    new URL(url);
    return url;
  } catch (error) {
    return "";
  }
}

function extractLinksFromPlainText(decodedData) {
  const links = [];
  const linkRegex = /https?:\/\/[^\s]+[^\s\.;]/g;
  const matches = decodedData.match(linkRegex);

  if (matches) {
    matches.forEach((match) => {
      const cleanedHref = cleanURL(match);
      if (cleanedHref) {
        links.push(cleanedHref);
      }
    });
  }

  return links;
}

function extractLinksFromHtml($) {
  const links = [];
  $("a").each((index, element) => {
    const href = $(element).attr("href");
    const cleanedHref = cleanURL(href);
    if (cleanedHref) {
      links.push(cleanedHref);
    }
  });

  return links;
}
