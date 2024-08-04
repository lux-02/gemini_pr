import AuthBox from "./authBox";
import styles from "@/styles/AnalysisResult.module.css";

function convertToUTC9(dateString) {
  const timezoneOffset = dateString.slice(-5); // "+0700" 혹은 다른 시간대
  const sign = timezoneOffset[0]; // '+' 또는 '-'
  const hoursOffset = parseInt(timezoneOffset.substring(1, 3), 10);
  const minutesOffset = parseInt(timezoneOffset.substring(3, 5), 10);

  // Date 객체 생성 (날짜 문자열을 UTC로 해석)
  const date = new Date(dateString);

  // 입력된 시간대를 기준으로 UTC 시간 계산
  const utcDate = new Date(
    date.getTime() -
      (hoursOffset * 60 + minutesOffset) * 60000 * (sign === "+" ? 1 : -1)
  );

  // UTC 시간에 9시간을 더해 UTC+9로 조정
  const utcPlus9Date = new Date(utcDate.getTime() + 9 * 60 * 60000);

  // UTC+9 날짜를 "YYYY-MM-DD HH:mm:ss [UTC+9]" 형식으로 변환
  const formattedDate = utcPlus9Date
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "");

  return formattedDate;
}

const AnalysisResult = ({ result }) => {
  if (!result || Object.keys(result).length === 0) {
    return;
  }

  const formattedDate = convertToUTC9(result.date);

  return (
    <div className={`${styles.wrap}`}>
      <ul>
        <li>
          <h4 className={`${styles.title}`}>[AUTHENTICATION]</h4>
          <div className={`${styles.auth} flex`}>
            <AuthBox v="spf" status={result.spf} />
            <AuthBox v="dkim" status={result.dkim} />
            <AuthBox v="dmarc" status={result.dmarc} />
          </div>
        </li>
        <li>
          <h4 className={`${styles.title}`}>[FROM-TO]</h4>
          <p>
            {result.from} {`--->`} {result.to}
          </p>
        </li>
        <li>
          <h4 className={`${styles.title}`}>[DATE]</h4>
          <p className={`${styles.date}`}>{formattedDate} (UTC+9)</p>
        </li>
        <li>
          {result.links && (
            <>
              <h4 className={`${styles.title}`}>[LINK]</h4>
              <ul>
                {result.links.map(
                  (link, index) => link && <li key={index}>{link}</li>
                )}
              </ul>
            </>
          )}
        </li>
        <li>
          {result.receivedPaths && (
            <>
              <h4 className={`${styles.title}`}>[RECEIVED PATH]</h4>
              <ul>
                {result.receivedPaths.map(
                  (path, index) =>
                    path && (
                      <li className={`${styles.list}`} key={index}>
                        <span className={`${styles.number}`}>#{index + 1}</span>
                        <br />
                        {path}
                      </li>
                    )
                )}
              </ul>
            </>
          )}
        </li>
        <li>
          {result.ipAddresses && (
            <>
              <h4 className={`${styles.title}`}>[IP ADDRESS]</h4>
              <ul>
                {result.ipAddresses.map(
                  (ip, index) => ip && <li key={index}>- {ip}</li>
                )}
              </ul>
            </>
          )}
        </li>
        <li>
          {result.hostNames && (
            <>
              <h4 className={`${styles.title}`}>[HOSTNAME]</h4>
              <ul>
                {result.hostNames.map(
                  (hn, index) => hn && <li key={index}>- {hn}</li>
                )}
              </ul>
            </>
          )}
        </li>
        <li>
          {result.domains && (
            <>
              <h4 className={`${styles.title}`}>[DOMAIN]</h4>
              <ul>
                {result.domains.map(
                  (dm, index) => dm && <li key={index}>- {dm}</li>
                )}
              </ul>
            </>
          )}
        </li>
      </ul>
    </div>
  );
};

export default AnalysisResult;
