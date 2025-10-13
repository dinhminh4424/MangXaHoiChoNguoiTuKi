import React from "react";
import { Link } from "react-router-dom";
import Quote from "../components/QuoteComponent";

function Home() {
  return (
    <div className="container mt-5">
      <Quote />
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <h1 className="display-4 mb-4">Chào mừng đến với Hoà Mình Vui Vẻ</h1>
          <p className="lead mb-4">
            Mạng xã hội an toàn và thân thiện dành cho cộng đồng người tự kỷ
          </p>
          <div className="d-grid gap-2 d-md-flex justify-content-md-center">
            <Link to="/login" className="btn btn-primary btn-lg me-md-2">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn btn-outline-primary btn-lg">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
