import React from "react";
import styles from "@/styles/AuthBox.module.css";

const AuthBox = ({ v, status }) => {
  let borderColor, backgroundColor, textColor, result;

  switch (v) {
    case "spf":
    default:
      result = "SPF";
      break;
    case "dkim":
      result = "DKIM";
      break;
    case "dmarc":
      result = "DMARC";
      break;
  }

  switch (status) {
    case "pass":
      borderColor = backgroundColor = textColor = "rgba(3, 199, 90, 0.8)";
      break;
    case "fail":
      borderColor = backgroundColor = textColor = "rgba(255, 59, 48, 0.8)";
      break;
    case "softfail":
      borderColor = backgroundColor = textColor = "rgba(255, 59, 48, 0.8)";
      break;
    case "none":
    default:
      borderColor = backgroundColor = textColor = "rgba(255, 59, 48, 0.8)";
      break;
  }

  return (
    <div className={`${styles.wrap} flex`} style={{ borderColor }}>
      <div className={`${styles.left} flex`} style={{ backgroundColor }}>
        <p>{result.toUpperCase()}</p>
      </div>
      <div className={`${styles.right} flex`} style={{ borderColor }}>
        <p style={{ color: textColor }}>{status}</p>
      </div>
    </div>
  );
};

export default AuthBox;
