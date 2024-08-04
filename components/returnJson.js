import React from "react";
import styles from "@/styles/ReturnJson.module.css";

const ReturnJson = ({ data, parentKey = "" }) => {
  // 재귀적으로 객체 렌더링
  const renderObject = (data, currentKey) => {
    return Object.entries(data)
      .filter(([_, value]) => value || value === 0)
      .map(([key, value]) => {
        const fullKey = currentKey ? `${currentKey}.${key}` : key;

        if (typeof value === "object" && value !== null) {
          return (
            <div className={`${styles.key}`} key={fullKey}>
              <strong className={`${styles.title}`}>{key.toUpperCase()}</strong>
              {Array.isArray(value)
                ? renderArray(value, fullKey)
                : renderObject(value, fullKey)}
            </div>
          );
        }

        return (
          <ul className={`${styles.liBox} flexCS`} key={fullKey}>
            <li className={`${styles.li}`}>
              <strong className={`${styles.title}`}>{key}</strong>
              {": "}
              {value.toString()}
            </li>
          </ul>
        );
      });
  };

  // 배열 렌더링
  const renderArray = (array, currentKey) => {
    return array
      .filter((item) => item || item === 0)
      .map((item, index) => {
        const fullKey = `${currentKey}[${index}]`;
        if (typeof item === "object" && item !== null) {
          return (
            <div key={fullKey}>
              {Array.isArray(item)
                ? renderArray(item, fullKey)
                : renderObject(item, fullKey)}
            </div>
          );
        }

        return (
          <ul className={`${styles.liBox} flexCS`} key={fullKey}>
            <li className={`${styles.li}`}>{item.toString()}</li>
          </ul>
        );
      });
  };

  return (
    <div className={`${styles.wrap} flexCS`}>
      {Array.isArray(data)
        ? renderArray(data, parentKey)
        : renderObject(data, parentKey)}
    </div>
  );
};

export default ReturnJson;
