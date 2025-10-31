import { useEffect } from "react";
import TextReaderAdvanced from "../components/TextReaderAdvanced";
import SpeechToText from "../components/SpeechToText";
import { useState } from "react";
import { useCallback } from "react";
import api from "../services/api";

function Home() {
  const [quote, setQuote] = useState("");
  const [error, setError] = useState("");

  const [text, setText] = useState("");

  const fetchQuote = useCallback(async () => {
    try {
      const res = await api.get("/api/quote/random");
      if (res.data.success) {
        setQuote(
          res.data.data.content + " của tác giả " + res.data.data?.author ||
            "Khuyết Danh"
        );
      }
    } catch (error) {
      setError(error.toString());
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const laygt = (data) => {
    setText((prev) => prev + " " + data);
  };

  return (
    <div className="container mt-5">
      {/* Đọc Van Bản */}
      <div className="row justify-content-center">
        <h1>{quote}</h1>
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          <TextReaderAdvanced text={quote} />
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      </div>

      {/* Nghe Âm Thanh  -> thành văn bản*/}
      {/* <div className="row justify-content-center">
        <h1>Chuyển từ âm thanh thành văn bản</h1>
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          <SpeechToText />
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      </div> */}

      {/* Nghe Âm Thanh  -> thành văn bản - 2  */}
      <div className="row justify-content-center">
        <h1>Chuyển từ âm thanh thành văn bản</h1>
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            placeholder="Nhấn vào micro để nói"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhấn vào micro để nói"
          ></textarea>
          <SpeechToText onTextChange={laygt} />
        </div>
      </div>
    </div>
  );
}

export default Home;
