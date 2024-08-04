import React from "react";
import styles from "@/styles/Contents.module.css";
import Header from "@/components/header";

const Contents = ({ bg, header, sub, contents }) => {
  return (
    <div className={`${styles.wrap} flex`}>
      <Header title={header} sub={sub} bg={bg} />
      <div className={`${styles.contents} flex`}>{contents}</div>
    </div>
  );
};
export default Contents;
