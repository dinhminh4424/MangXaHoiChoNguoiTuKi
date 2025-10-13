import { useEffect, useState } from "react";

function Quote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true); // quản lý hiển thị
  useEffect(() => {
    // lấy câu trích dẫn ngẫu nhiên từ backend
    fetch("http://localhost:5000/api/quote/random", {
      method: "GET",
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setQuote(data.data);
          setLoading(false);
        } else {
          console.error("Lỗi khi lấy câu trích dẫn:", data.message);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi lấy câu trích dẫn:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (!visible) return null; // Nếu đã bấm X thì ẩn luôn

  return (
    <div className="container mt-3">
      <div
        className="alert alert-info alert-dismissible fade show shadow-sm"
        style={{
          position: "relative",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          maxWidth: "600px",
          margin: "20px auto",
        }}
      >
        {loading ? (
          <p>Đang tải câu trích dẫn...</p>
        ) : (
          <>
            {quote ? (
              <>
                <strong style={{ fontStyle: "italic", marginBottom: "10px" }}>
                  "{quote.content}"
                </strong>
                <br />
                <small
                  style={{
                    fontStyle: "italic",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  -- {quote.author || "Khuyết Danh"} --
                </small>
              </>
            ) : (
              <p>Không có câu trích dẫn nào để hiển thị.</p>
            )}
          </>
        )}
        <button
          className="btn btn-close"
          onClick={() => setVisible(false)} // Ẩn khi bấm X
        ></button>
      </div>
    </div>
  );
}

export default Quote;
