import React from "react";

export default function CustomField({ label, children }) {
  return (
    <div>
      <div style={{ fontWeight: 400, marginBottom: "0.4rem" }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
