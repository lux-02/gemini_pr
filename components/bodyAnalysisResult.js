import styles from "@/styles/AnalysisResult.module.css";

const bodyAnalysisResult = ({ result }) => {
  if (!result || Object.keys(result).length === 0) {
    return;
  }

  return (
    <div className={`${styles.wrap}`}>
      <ul>
        <li className={`${styles.li}`}>
          <h4 className={`${styles.title}`}>[TEXT]</h4>
          <p>{result.body}</p>
        </li>
        <li className={`${styles.li}`}>
          <h4 className={`${styles.title}`}>[URL]</h4>
          <ul>
            {result.links.map(
              (link, index) => link && <li key={index}>- {link}</li>
            )}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default bodyAnalysisResult;
