import React from "react";
import styles from "@/styles/Header.module.css";

const Header = ({ bg, title, sub }) => {
  const h2Style = sub !== undefined ? { height: "80%" } : {};
  const bgColor = {
    backgroundColor: bg,
  };
  return (
    <div className={`${styles.wrap} flexSC`} style={bgColor}>
      <h2 className={`${styles.title} flexSC`} style={h2Style}>
        {title}
      </h2>
      {sub !== undefined && <h3 className={`${styles.sub} flexSC`}>{sub}</h3>}
    </div>
  );
};
export default Header;
