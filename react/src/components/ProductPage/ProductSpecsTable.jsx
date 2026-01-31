import React from "react";

export default function ProductSpecsTable({ specs }) {
  const entries = Object.entries(specs || {});
  return (
    <div className="pp-specTable" role="table" aria-label="Product specs">
      {entries.map(([k, v]) => (
        <div className="pp-specRow" role="row" key={k}>
          <div className="pp-specKey" role="cell">{k}</div>
          <div className="pp-specVal" role="cell">{v}</div>
        </div>
      ))}
    </div>
  );
}
