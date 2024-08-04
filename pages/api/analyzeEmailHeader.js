export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const emailData = req.body.emailData;
      if (!emailData) {
        throw new Error("Email data is required");
      }

      const result = analyzeEmailHeader(emailData);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Base64 -> UTF-8
const decodeBase64Utf8 = (encodedStr) => {
  try {
    const decodedStr = Buffer.from(encodedStr, "base64").toString("utf8");
    return decodedStr;
  } catch (error) {
    console.error("Decoding error:", error);
    return encodedStr;
  }
};

const analyzeEmailHeader = (emailData) => {
  // IP 주소 추출을 위한 정규 표현식
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

  // 도메인 정보 추출을 위한 정규 표현식
  const domainRegex = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/;

  // 호스트 이름 추출을 위한 정규 표현식
  const hostRegex = /\((.*?)\[/;

  const ipAddresses = [];
  const domains = new Set();
  const hostNames = [];

  const lines = emailData.split("\n");
  const result = {
    spf: "Not Found",
    dkim: "Not Found",
    dmarc: "Not Found",
    receivedPaths: [],
    date: "Not Found",
    to: "Not Found",
    from: "Not Found",
    links: [],
    ipAddresses: [],
    domains: [],
    hostNames: [],
  };

  let isHTMLContent = false;
  let htmlContent = "";

  // 이메일 내용 라인 별로 데이터 파싱
  lines.forEach((line) => {
    if (line.trim().startsWith("<div>") || isHTMLContent) {
      htmlContent += line + "\n";
      if (line.trim().endsWith("</div>")) {
        isHTMLContent = false;
      } else {
        isHTMLContent = true;
      }
    }

    // SPF 데이터 파싱
    if (line.includes("spf=softfail")) {
      result.spf = "softfail";
    } else if (line.includes("spf=pass")) {
      result.spf = "pass";
    } else if (line.includes("spf=neutral")) {
      result.spf = "neutral";
    } else if (line.includes("spf=none")) {
      result.spf = "none";
    }

    // DMARC 데이터 파싱
    if (line.includes("dmarc=fail")) {
      result.dmarc = "fail";
    } else if (line.includes("dmarc=pass")) {
      result.dmarc = "pass";
    }

    // DKIM 데이터 파싱
    if (line.includes("dkim=fail")) {
      result.dkim = "fail";
    } else if (line.includes("dkim=pass")) {
      result.dkim = "pass";
    }

    // Received 데이터 파싱
    if (line.startsWith("Received:")) {
      const receivedInfo = [];
      receivedInfo.push(line.substring(15).trim());
      console.log(receivedInfo);

      let nextLineIndex = lines.indexOf(line) + 1;
      let continuationLine = true;

      while (nextLineIndex < lines.length && continuationLine) {
        const nextLine = lines[nextLineIndex].trim();
        console.log(nextLine);
        if (nextLine.startsWith("by")) {
          receivedInfo.push(nextLine.substring(2).trim());
        } else {
          continuationLine = false;
        }
        nextLineIndex++;
      }
      result.receivedPaths.push(receivedInfo);

      // Received 경로에서 IP 주소 추출
      const ipMatch = line.match(ipRegex);
      if (ipMatch && ipMatch[0] !== "127.0.0.1" && ipMatch[0] !== "0.0.0.0") {
        ipAddresses.push(ipMatch[0]);
      }

      // Received 경로에서 도메인 추출
      const domainMatch = line.match(domainRegex);
      if (domainMatch) {
        domains.add(domainMatch[1]);
      }

      // Received 경로에서 호스트 이름 추출
      const hostMatch = line.match(hostRegex);
      if (hostMatch) {
        hostNames.push(hostMatch[1].trim());
      }
    }

    // Date 데이터 파싱
    if (line.startsWith("Date:")) {
      result.date = line.substring(5).trim();
    }

    // From 데이터 파싱
    if (line.startsWith("From:")) {
      const fromValue = line.substring(5).trim();
      const encodedPartMatch = fromValue.match(/"?\=?UTF-8\?B\?(.*?)\?=/i);
      console.log(encodedPartMatch);
      if (encodedPartMatch) {
        const encodedPart = encodedPartMatch[1];
        const decodedName = decodeBase64Utf8(encodedPart);
        const emailPart = fromValue.split(" ")[1] || "";
        result.from = decodedName + " " + emailPart;
      } else {
        result.from = fromValue;
      }
    }

    // To 데이터 파싱
    if (line.startsWith("To:")) {
      const toValue = line.substring(3).trim();
      const encodedPartMatch = toValue.match(/"?\=?UTF-8\?B\?(.*?)\?=/i);
      if (encodedPartMatch) {
        const encodedPart = encodedPartMatch[1];
        const decodedName = decodeBase64Utf8(encodedPart);
        const emailPart = toValue.split(" ")[1] || "";
        result.to = decodedName + " " + emailPart;
      } else {
        result.to = toValue;
      }
    }
  });

  // HTML 컨텐츠에서 링크 추출
  const linkRegex = /href="([^"]*)"/g;
  let match;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    result.links.push(match[1]);
  }

  // Received 값은 역순으로 해석하기 때문에 리버싱해서 저장
  result.receivedPaths.reverse();

  result.ipAddresses = ipAddresses;
  result.domains = Array.from(domains);
  result.hostNames = hostNames;

  // 데이터 필터링 (항목이 존재하는 데이터만 리턴)
  const filteredResult = {};
  Object.keys(result).forEach((key) => {
    if (Array.isArray(result[key]) && result[key].length > 0) {
      filteredResult[key] = result[key];
    } else if (typeof result[key] === "string" && result[key] !== "") {
      filteredResult[key] = result[key];
    }
  });

  return filteredResult;
};
