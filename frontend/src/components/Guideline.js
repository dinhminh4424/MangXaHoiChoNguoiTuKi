import React, { useEffect, useState } from "react";

function Guideline({ type }) {
  const [guideline, setGuideline] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/emergency/guideline/${type}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGuideline(data.data);
      });
  }, [type]);

  if (!guideline) return <p>Đang tải hướng dẫn sơ cứu...</p>;

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "2px solid #1976d2",
        borderRadius: "10px",
        backgroundColor: "#e3f2fd",
        width: "300px",
      }}
    >
      <h3>{guideline.title}</h3>
      <ul>
        {guideline.steps.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ul>
    </div>
  );
}

export default Guideline;
