import React, { useMemo } from "react";

/**
 * Documents panel:
 * - Right now it shows placeholders.
 * - Later, replace the URLs with real PDFs hosted in /public/docs or a CDN.
 */
export default function ProductDocuments({ productId }) {
  const docs = useMemo(() => {
    // Example placeholders. Replace with your real URLs.
    return [
      { name: "Certificate of Analysis (COA)", url: "", note: "Upload your COA PDF and link it here." },
      { name: "Safety Data Sheet (SDS)", url: "", note: "Upload your SDS PDF and link it here." },
      { name: "Spec Sheet", url: "", note: "Optional: product spec sheet / tech sheet." },
    ];
  }, [productId]);

  return (
    <div className="pp-section">
      <h3 className="pp-h3">Documents</h3>
      <div className="pp-docList">
        {docs.map((d) => (
          <div className="pp-docCard" key={d.name}>
            <div className="pp-docLeft">
              <div className="pp-docName">{d.name}</div>
              <div className="pp-docNote">{d.note}</div>
            </div>
            <div className="pp-docRight">
              {d.url ? (
                <a className="pp-docBtn" href={d.url} target="_blank" rel="noreferrer">Download</a>
              ) : (
                <button className="pp-docBtn isDisabled" type="button" disabled>Upload to enable</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pp-note">
        Quick way to ship PDFs: put them in <code>react/public/docs</code> and link like <code>/docs/coa.pdf</code>.
      </div>
    </div>
  );
}
