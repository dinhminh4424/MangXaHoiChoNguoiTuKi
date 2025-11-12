// pages/journal/JournalStats.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { journalService } from "../../services/journalService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const JournalStats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await journalService.getJournalStats(user.id, period);
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError("Không thể tải dữ liệu thống kê.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, period]);

  if (loading) {
    return <div className="text-center mt-5">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-4">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="text-center mt-5">Không có dữ liệu để hiển thị.</div>
    );
  }

  // Dữ liệu cho biểu đồ đường (Diễn biến tâm trạng)
  const moodOverTimeData = {
    labels: stats.moodOverTime.map((item) => item._id),
    datasets: [
      {
        label: "Tâm trạng trung bình",
        data: stats.moodOverTime.map((item) => item.avgMood),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ tròn (Tần suất cảm xúc)
  const emotionCountsData = {
    labels: stats.emotionCounts.map((item) => item._id),
    datasets: [
      {
        label: "Số lần xuất hiện",
        data: stats.emotionCounts.map((item) => item.count),
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
        ],
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ cột (Yếu tố kích hoạt)
  const triggerCountsData = {
    labels: stats.triggerCounts.map((item) => item._id),
    datasets: [
      {
        label: "Số lần xuất hiện",
        data: stats.triggerCounts.map((item) => item.count),
        backgroundColor: "rgba(153, 102, 255, 0.7)",
      },
    ],
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() => navigate("/journal")}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="mb-0">Thống kê Nhật ký</h2>
          <p className="text-muted mb-0">
            Nhìn lại hành trình cảm xúc của bạn
          </p>
        </div>
      </div>

      <div className="d-flex justify-content-center gap-2 mb-4">
        {["7d", "30d", "90d"].map((p) => (
          <button
            key={p}
            className={`btn ${
              period === p ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setPeriod(p)}
          >
            {p === "7d"
              ? "7 ngày qua"
              : p === "30d"
              ? "30 ngày qua"
              : "90 ngày qua"}
          </button>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Diễn biến tâm trạng</h5>
              {stats.moodOverTime.length > 0 ? (
                <Line data={moodOverTimeData} />
              ) : (
                <p className="text-muted">Chưa có dữ liệu đánh giá tâm trạng.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Tần suất cảm xúc</h5>
              {stats.emotionCounts.length > 0 ? (
                <Pie data={emotionCountsData} />
              ) : (
                <p className="text-muted">Chưa có dữ liệu về cảm xúc.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Yếu tố kích hoạt phổ biến</h5>
              {stats.triggerCounts.length > 0 ? (
                <Bar data={triggerCountsData} />
              ) : (
                <p className="text-muted">
                  Chưa có dữ liệu về yếu tố kích hoạt.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalStats;