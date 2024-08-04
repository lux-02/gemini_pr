import { useState, useEffect } from "react";
import { marked } from "marked";
import styles from "@/styles/Home.module.css";
import Contents from "@/components/contents";
import Map from "@/components/map";
import ReturnJson from "@/components/returnJson";
import BodyAnalysisResult from "@/components/bodyAnalysisResult";
import AuthBox from "@/components/authBox";

export default function Home() {
  const connect = "";
  const [ipInfo, setIpInfo] = useState([]);
  const [domainInfo, setDomainInfo] = useState([]);
  const [paths, setPaths] = useState([]);
  const [bodyAnalysisResult, setBodyAnalysisResult] = useState({});
  const [geminiResult, setGeminiResult] = useState({
    labelAnalysis: "",
    spamAnalysis: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const [emailData, setEmailData] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [ipAddr, setIpAddr] = useState([]);
  const [hostName, setHostName] = useState([]);

  useEffect(() => {
    ipAddr.forEach((ip) => {
      fetch(`${connect}/api/censys_ip?ip=${ip}`)
        .then((response) => response.json())
        .then((result) => {
          if (result && result.result.location) {
            setIpInfo((prevIpInfo) => [...prevIpInfo, { ip, data: result }]);
            setPaths((prevPaths) => [
              ...prevPaths,
              {
                lat: result.result.location.coordinates.latitude,
                lng: result.result.location.coordinates.longitude,
              },
            ]);
          }
        })
        .catch((error) => console.error(error));
    });
  }, [ipAddr]);

  useEffect(() => {
    hostName.forEach((domain) => {
      fetch(`${connect}/api/censys_domain?domain=${domain}`)
        .then((response) => response.json())
        .then((result) => {
          if (result && result.result) {
            setDomainInfo((prevDomainInfo) => [
              ...prevDomainInfo,
              { domain, data: result },
            ]);
          }
        })
        .catch((error) => console.error(error));
    });
  }, [hostName]);

  const handleEmailDataChange = (e) => {
    setEmailData(e.target.value);
  };

  const analyzeEmailHeader = async () => {
    setIsLoading(true);
    setIpInfo([]);
    setDomainInfo([]);
    setIpAddr([]);
    setHostName([]);
    setAnalysisResult("");
    setEmailData("");
    setPaths([]);
    setBodyAnalysisResult({});
    setGeminiResult({ labelAnalysis: "", spamAnalysis: "" });

    try {
      const headerResponse = await fetch(`${connect}/api/analyzeEmailHeader`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailData }),
      });
      const headerData = await headerResponse.json();

      setAnalysisResult(headerData);
      setIpAddr(headerData.ipAddresses || []);
      setHostName(headerData.hostNames || []);

      // 본문 분석 API 호출
      const bodyResponse = await fetch(`${connect}/api/analyzeEmailBody`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawEmailData: emailData }),
      });
      const bodyData = await bodyResponse.json();
      setBodyAnalysisResult(bodyData);

      // Google Gemini 분석 API 호출
      const geminiResponse = await fetch(`${connect}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: bodyData.body }),
      });
      const geminiData = await geminiResponse.json();
      setGeminiResult(geminiData);
    } catch (error) {
      console.error("분석 중 에러 발생:", error);
      setAnalysisResult("분석 중 에러 발생");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`wrap flex`}>
      <div className={`${styles.inputWrap} flex`}>
        <div className={`${styles.inputMailWrap} flex`}>
          <textarea
            placeholder="입력하세요.."
            value={emailData}
            onChange={handleEmailDataChange}
          />
        </div>
        <div className={`${styles.submitBtnWrap} flex`}>
          <button
            onClick={analyzeEmailHeader}
            disabled={!emailData.trim().length}
          >
            ANALYZE
          </button>
        </div>
      </div>
      <div className={`${styles.outputWrap} flex`}>
        <div className={`${styles.outputBoxWrap} flex`}>
          <Contents header={"IP MAP"} contents={<Map paths={paths} />} />
          <Contents
            header={"Header Analysis"}
            contents={
              <div>
                <div className={`${styles.authBoxContainer}`}>
                  <AuthBox v="spf" status={analysisResult.spf} />
                  <AuthBox v="dkim" status={analysisResult.dkim} />
                  <AuthBox v="dmarc" status={analysisResult.dmarc} />
                </div>
                <ReturnJson data={analysisResult} />
              </div>
            }
          />
          <Contents
            header={"Body Analysis"}
            contents={<BodyAnalysisResult result={bodyAnalysisResult} />}
          />

          <Contents
            header={"Gemini Label Analysis"}
            contents={
              isLoading ? (
                <p>로딩중...</p>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(geminiResult.labelAnalysis),
                  }}
                />
              )
            }
          />

          <Contents
            header={"Gemini Spam Analysis"}
            contents={
              isLoading ? (
                <p>로딩중...</p>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(geminiResult.spamAnalysis),
                  }}
                />
              )
            }
          />

          {ipInfo.map(
            (info, index) =>
              info.data && (
                <Contents
                  key={index}
                  header={`Censys - IP`}
                  sub={`${info.ip}`}
                  contents={<ReturnJson data={info.data.result} />}
                />
              )
          )}

          {domainInfo.map(
            (info, index) =>
              info.data && (
                <Contents
                  key={index}
                  header={`Censys - Domain`}
                  sub={`${info.domain}`}
                  contents={<ReturnJson data={info.data.result} />}
                />
              )
          )}
        </div>
      </div>
    </div>
  );
}
