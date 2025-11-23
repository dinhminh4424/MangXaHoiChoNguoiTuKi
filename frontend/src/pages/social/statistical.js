import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useProfile } from "../../contexts/ProfileContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
} from "recharts";

// ==================== CONSTANTS ====================
const CHART_COLORS = {
  primary: "#007bff",
  success: "#28a745",
  info: "#17a2b8",
  warning: "#ffc107",
  danger: "#dc3545",
  purple: "#6f42c1",
  pink: "#e83e8c",
  teal: "#20c997",
  orange: "#fd7e14",
  indigo: "#6610f2",
  secondary: "#6c757d",
};

const MOOD_COLORS = {
  happy: "#28a745",
  sad: "#17a2b8",
  angry: "#dc3545",
  anxious: "#ffc107",
  excited: "#e83e8c",
  tired: "#6f42c1",
  neutral: "#20c997",
  fearful: "#fd7e14",
  disgusted: "#6610f2",
  surprised: "#007bff",
};

const PERIOD_OPTIONS = [
  { value: "7days", label: "7 ngày qua", icon: "ri-calendar-2-line" },
  { value: "30days", label: "30 ngày qua", icon: "ri-calendar-line" },
  { value: "90days", label: "90 ngày qua", icon: "ri-calendar-event-line" },
  { value: "all", label: "Tất cả thời gian", icon: "ri-history-line" },
];

// ==================== UTILITY FUNCTIONS ====================
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
};

const getMoodColor = (emotion) => {
  if (!emotion) return CHART_COLORS.primary;
  return MOOD_COLORS[emotion.toLowerCase()] || CHART_COLORS.primary;
};

const getMoodLabel = (emotion) => {
  const labels = {
    happy: "Vui vẻ",
    sad: "Buồn",
    angry: "Tức giận",
    anxious: "Lo lắng",
    excited: "Phấn khích",
    tired: "Mệt mỏi",
    neutral: "Bình thường",
    fearful: "Sợ hãi",
    disgusted: "Ghê tởm",
    surprised: "Ngạc nhiên",
  };
  return labels[emotion?.toLowerCase()] || emotion || "Không xác định";
};

// ==================== CUSTOM COMPONENTS ====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border shadow-lg rounded p-3">
      <p className="fw-bold mb-2 text-dark border-bottom pb-1">{label}</p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="mb-1 d-flex align-items-center"
          style={{ color: entry.color }}
        >
          <span
            className="d-inline-block me-2 rounded-circle"
            style={{ width: 8, height: 8, backgroundColor: entry.color }}
          />
          {entry.name}: <strong className="ms-1">{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

const EmptyState = ({
  icon = "ri-bar-chart-line",
  message = "Chưa có dữ liệu",
  description,
}) => (
  <div className="text-center text-muted py-5">
    <i className={`${icon} fs-1 mb-3 d-block opacity-50`} />
    <h6 className="mb-2">{message}</h6>
    {description && <small className="opacity-75">{description}</small>}
  </div>
);

const LoadingState = () => (
  <div className="text-center py-5">
    <div className="spinner-border text-primary mb-3" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="text-muted">Đang tải dữ liệu thống kê...</p>
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
  color = "primary",
  description,
  loading,
}) => (
  <div className="col-xl-2 col-md-4 col-6 mb-3">
    <div className={`card border-${color} h-100 shadow-sm`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            {loading ? (
              <div className="placeholder-glow">
                <div
                  className="placeholder col-8 mb-2"
                  style={{ height: "24px" }}
                />
                <div className="placeholder col-6" style={{ height: "16px" }} />
              </div>
            ) : (
              <>
                <h4 className={`card-title text-${color} mb-1`}>
                  {typeof value === "number" ? formatNumber(value) : value}
                </h4>
                <p className="card-text text-muted small mb-1">{title}</p>
                {description && (
                  <small className="text-muted d-block mt-1">
                    {description}
                  </small>
                )}
              </>
            )}
          </div>
          <div className={`text-${color} opacity-75`}>
            <i className={`${icon} fs-2`} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PeriodSelector = ({ value, onChange, loading }) => (
  <div className="dropdown">
    <button
      className="btn btn-outline-primary dropdown-toggle d-flex align-items-center"
      type="button"
      disabled={loading}
      data-bs-toggle="dropdown"
    >
      <i className="ri-calendar-line me-2" />
      {PERIOD_OPTIONS.find((opt) => opt.value === value)?.label}
    </button>
    <ul className="dropdown-menu dropdown-menu-end">
      {PERIOD_OPTIONS.map((option) => (
        <li key={option.value}>
          <button
            className={`dropdown-item d-flex align-items-center ${
              value === option.value ? "active" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            <i className={`${option.icon} me-2`} />
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
);

const TabNavigation = ({ activeTab, onTabChange, stats }) => {
  const tabs = [
    { key: "overview", icon: "ri-dashboard-line", label: "Tổng quan" },
    { key: "emotions", icon: "ri-emotion-line", label: "Cảm xúc" },
    { key: "journal", icon: "ri-book-open-line", label: "Nhật ký" },
    { key: "growth", icon: "ri-user-line", label: "Phát triển" },
    { key: "social", icon: "ri-group-line", label: "Xã hội" },
  ];

  return (
    <div className="nav nav-pills nav-justified bg-light rounded p-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`nav-link d-flex align-items-center justify-content-center ${
            activeTab === tab.key ? "active" : ""
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          <i className={`${tab.icon} me-2`} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const UserStatistical = () => {
  const { user } = useAuth();
  const { dashboardUserStats } = useProfile();
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ period: "7days" });
  const [localError, setLocalError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [localLoading, setLocalLoading] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLocalLoading(true);
      try {
        const res = await dashboardUserStats({ period: filter.period });
        if (res?.success) {
          setStats(res.data);
          setLocalError("");
        } else {
          setLocalError(res?.message || "Lỗi không xác định khi tải dữ liệu");
        }
      } catch (err) {
        setLocalError("Lỗi kết nối: " + err.message);
      } finally {
        setLocalLoading(false);
      }
    };

    loadData();
  }, [user, dashboardUserStats, filter.period]);

  const handleFilterChange = useCallback((newPeriod) => {
    setFilter((prev) => ({ ...prev, period: newPeriod }));
  }, []);

  // ==================== MEMOIZED DATA ====================
  const overviewStats = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: "Bài viết",
        value: stats.overview?.totalPosts || 0,
        icon: "ri-file-text-line",
        color: "primary",
        description: `${stats.periodStats?.newPosts || 0} bài mới trong kỳ`,
      },
      {
        title: "Nhật ký",
        value: stats.overview?.totalJournals || 0,
        icon: "ri-book-open-line",
        color: "success",
        description: `${stats.periodStats?.newJournals || 0} bài mới trong kỳ`,
      },
      {
        title: "Bình luận",
        value: stats.overview?.totalComments || 0,
        icon: "ri-chat-3-line",
        color: "info",
        description: `${stats.periodStats?.newComments || 0} bình luận mới`,
      },
      {
        title: "Nhóm",
        value: stats.overview?.totalGroups || 0,
        icon: "ri-group-line",
        color: "warning",
        description: "Đang tham gia",
      },
      {
        title: "Tin nhắn",
        value: stats.overview?.totalMessages || 0,
        icon: "ri-message-3-line",
        color: "purple",
        description: "Đã gửi",
      },
      {
        title: "Cảm xúc",
        value: stats.periodStats?.newMoodLogs || 0,
        icon: "ri-emotion-line",
        color: "teal",
        description: "Đã ghi nhận trong kỳ",
      },
    ];
  }, [stats]);

  // Timeline data from timelineStats
  const timelineData = useMemo(() => {
    if (!stats?.timelineStats) return [];

    const {
      posts = [],
      journals = [],
      comments = [],
      moods = [],
    } = stats.timelineStats;

    const allDates = [
      ...new Set([
        ...posts.map((p) => p._id),
        ...journals.map((j) => j._id),
        ...comments.map((c) => c._id),
        ...moods.map((m) => m._id),
      ]),
    ].sort();

    return allDates.map((date) => ({
      date,
      posts: posts.find((p) => p._id === date)?.count || 0,
      journals: journals.find((j) => j._id === date)?.count || 0,
      comments: comments.find((c) => c._id === date)?.count || 0,
      moods: moods.find((m) => m._id === date)?.count || 0,
    }));
  }, [stats?.timelineStats]);

  // Mood distribution data
  const moodDistributionData = useMemo(() => {
    const distribution = stats?.emotionAnalytics?.moodDistribution || [];
    return distribution.map((mood) => ({
      name: getMoodLabel(mood.emotion),
      emotion: mood.emotion,
      value: mood.count || 0,
      percentage: mood.percentage || 0,
      intensity: mood.avgIntensity || 0,
      color: getMoodColor(mood.emotion),
    }));
  }, [stats?.emotionAnalytics?.moodDistribution]);

  // Mood timeline data
  const moodTimelineData = useMemo(() => {
    const timeline = stats?.emotionAnalytics?.moodTimeline || [];
    return timeline.map((item) => ({
      date: item.date || item.rawDate,
      intensity: item.intensity || 0,
      count: item.count || 0,
      emotion: item.emotion,
      variety: item.variety || 0,
    }));
  }, [stats?.emotionAnalytics?.moodTimeline]);

  // Emotion patterns data (by day of week)
  const emotionPatternsData = useMemo(() => {
    const patterns = stats?.emotionAnalytics?.emotionPatterns || [];
    return patterns.map((pattern) => ({
      name: pattern.dayName,
      dayOfWeek: pattern.dayOfWeek,
      entries: pattern.totalEntries || 0,
      variety: pattern.emotionalVariety || 0,
      avgIntensity: pattern.intensityRange?.avg || 0,
      dominantEmotion: pattern.dominantEmotion,
    }));
  }, [stats?.emotionAnalytics?.emotionPatterns]);

  // Time of day analysis
  const timeOfDayData = useMemo(() => {
    const analysis = stats?.emotionAnalytics?.timeOfDayAnalysis || [];
    const labels = {
      morning: "Sáng",
      afternoon: "Chiều",
      evening: "Tối",
      night: "Đêm",
    };
    return analysis.map((item) => ({
      name: labels[item.timeOfDay] || item.timeOfDay,
      entries: item.totalEntries || 0,
      intensity: item.avgIntensity || 0,
      dominantEmotion: getMoodLabel(item.dominantEmotion),
    }));
  }, [stats?.emotionAnalytics?.timeOfDayAnalysis]);

  // Emotional peaks
  const emotionalPeaks = useMemo(() => {
    return stats?.emotionAnalytics?.peakMoments || [];
  }, [stats?.emotionAnalytics?.peakMoments]);

  // Personal growth data
  const personalGrowthData = useMemo(() => {
    if (!stats?.personalGrowth) return [];

    const {
      completedTasks = 0,
      totalTasks = 0,
      priorityBreakdown = {},
    } = stats.personalGrowth;
    const inProgress = totalTasks - completedTasks;

    const data = [];
    if (completedTasks > 0)
      data.push({
        name: "Hoàn thành",
        value: completedTasks,
        color: CHART_COLORS.success,
      });
    if (inProgress > 0)
      data.push({
        name: "Đang thực hiện",
        value: inProgress,
        color: CHART_COLORS.warning,
      });

    return data;
  }, [stats?.personalGrowth]);

  // Social support data
  const socialSupportData = useMemo(() => {
    if (!stats?.socialSupport) return null;
    return stats.socialSupport;
  }, [stats?.socialSupport]);

  // Behavior analytics
  const behaviorData = useMemo(() => {
    if (!stats?.behaviorAnalytics) return null;
    return stats.behaviorAnalytics;
  }, [stats?.behaviorAnalytics]);

  // ==================== TAB RENDERERS ====================
  const renderOverviewTab = () => (
    <>
      {/* Stats Cards */}
      <div className="row mb-4">
        {overviewStats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={localLoading} />
        ))}
      </div>

      {/* Activity Timeline Chart */}
      <div className="row mb-4">
        <div className="col-xl-8 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">
                <i className="ri-bar-chart-line me-2 text-primary" />
                Hoạt động theo thời gian
              </h5>
            </div>
            <div className="card-body">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#6c757d"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#6c757d" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="posts"
                      fill={CHART_COLORS.success}
                      name="Bài viết"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="journals"
                      fill={CHART_COLORS.info}
                      name="Nhật ký"
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      stroke={CHART_COLORS.warning}
                      strokeWidth={2}
                      name="Bình luận"
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moods"
                      stroke={CHART_COLORS.pink}
                      strokeWidth={2}
                      name="Cảm xúc"
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon="ri-bar-chart-line"
                  message="Chưa có dữ liệu hoạt động"
                  description="Dữ liệu sẽ xuất hiện khi bạn bắt đầu sử dụng"
                />
              )}
            </div>
          </div>
        </div>

        {/* Mood Distribution Pie */}
        <div className="col-xl-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">
                <i className="ri-emotion-line me-2 text-success" />
                Phân bố cảm xúc
              </h5>
            </div>
            <div className="card-body">
              {moodDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                    >
                      {moodDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Số lần"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon="ri-emotion-line"
                  message="Chưa có dữ liệu cảm xúc"
                  description="Hãy ghi lại cảm xúc của bạn"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {stats?.insights?.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-transparent">
                <h5 className="card-title mb-0">
                  <i className="ri-lightbulb-line me-2 text-warning" />
                  Insights & Gợi ý
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {stats.insights.map((insight, i) => (
                    <div key={i} className="col-md-6 mb-3">
                      <div className="card border-0 bg-light h-100">
                        <div className="card-body d-flex">
                          <i className="ri-checkbox-circle-line text-success me-2 mt-1" />
                          <p className="mb-0">{insight}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderEmotionsTab = () => (
    <div className="row">
      {/* Radar Chart */}
      <div className="col-xl-6 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-radar-line me-2 text-primary" />
              Phân tích tổng quan cảm xúc
            </h5>
          </div>
          <div className="card-body">
            {moodDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={moodDistributionData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Tần suất"
                    dataKey="value"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="ri-radar-line" message="Chưa có dữ liệu" />
            )}
          </div>
        </div>
      </div>

      {/* Intensity Bar Chart */}
      <div className="col-xl-6 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-bar-chart-horizontal-line me-2 text-success" />
              Cường độ cảm xúc
            </h5>
          </div>
          <div className="card-body">
            {moodDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={moodDistributionData}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip
                    formatter={(v) => [`${(v * 100).toFixed(1)}%`, "Cường độ"]}
                  />
                  <Bar dataKey="intensity">
                    {moodDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon="ri-bar-chart-horizontal-line"
                message="Chưa có dữ liệu"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mood Timeline */}
      <div className="col-xl-8 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-line-chart-line me-2 text-info" />
              Xu hướng cảm xúc theo thời gian
            </h5>
          </div>
          <div className="card-body">
            {moodTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={moodTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="intensity"
                    stroke={CHART_COLORS.pink}
                    strokeWidth={2}
                    name="Cường độ"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.purple}
                    strokeWidth={2}
                    name="Số lần ghi nhận"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon="ri-line-chart-line"
                message="Chưa có dữ liệu xu hướng"
              />
            )}
          </div>
        </div>
      </div>

      {/* Time of Day Analysis */}
      <div className="col-xl-4 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-time-line me-2 text-warning" />
              Cảm xúc theo thời điểm
            </h5>
          </div>
          <div className="card-body">
            {timeOfDayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="entries"
                    fill={CHART_COLORS.info}
                    name="Số lần ghi nhận"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="ri-time-line" message="Chưa có dữ liệu" />
            )}
          </div>
        </div>
      </div>

      {/* Emotional Peaks */}
      <div className="col-12 mb-4">
        <div className="card shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-pulse-line me-2 text-danger" />
              Khoảnh khắc cảm xúc mạnh
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {emotionalPeaks.length > 0 ? (
                emotionalPeaks.map((peak, i) => (
                  <div key={i} className="col-md-3 col-6 mb-3">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body text-center">
                        <div
                          className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center shadow"
                          style={{
                            width: 60,
                            height: 60,
                            backgroundColor:
                              peak.color || getMoodColor(peak.emotion),
                            color: "white",
                          }}
                        >
                          <i className="ri-emotion-line fs-4" />
                        </div>
                        <h6 className="mb-1">{getMoodLabel(peak.emotion)}</h6>
                        <div className="text-muted small">
                          <div>
                            Cường độ: {((peak.intensity || 0) * 100).toFixed(0)}
                            %
                          </div>
                          <div>{peak.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <EmptyState
                    icon="ri-pulse-line"
                    message="Chưa có khoảnh khắc cảm xúc mạnh"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Summary */}
      {stats?.emotionAnalytics?.summary && (
        <div className="col-12 mb-4">
          <div className="card shadow-sm border-info">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 className="text-info mb-2">
                    <i className="ri-information-line me-2" />
                    Tổng kết cảm xúc
                  </h5>
                  <p className="mb-0">
                    {stats.emotionAnalytics.summary.summary}
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="d-flex justify-content-end gap-4">
                    <div className="text-center">
                      <h4 className="text-primary mb-0">
                        {stats.emotionAnalytics.summary.totalEntries}
                      </h4>
                      <small className="text-muted">Tổng ghi nhận</small>
                    </div>
                    <div className="text-center">
                      <h4 className="text-success mb-0">
                        {stats.emotionAnalytics.summary.positiveRatio}%
                      </h4>
                      <small className="text-muted">Tích cực</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderJournalTab = () => (
    <div className="row">
      {/* Journal Stats */}
      <div className="col-xl-4 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-line-chart-line me-2 text-success" />
              Thống kê nhật ký
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              {[
                {
                  value: stats?.journalAnalytics?.totalEntries || 0,
                  label: "Tổng số bài",
                  color: "primary",
                  icon: "ri-file-text-line",
                },
                {
                  value: stats?.journalAnalytics?.avgMoodRating || 0,
                  label: "Điểm tâm trạng TB",
                  color: "success",
                  icon: "ri-emotion-line",
                },
                {
                  value: stats?.journalAnalytics?.writingFrequency || "--",
                  label: "Tần suất viết",
                  color: "info",
                  icon: "ri-calendar-line",
                },
                {
                  value: stats?.journalAnalytics?.commonTags?.length || 0,
                  label: "Tags phổ biến",
                  color: "warning",
                  icon: "ri-hashtag",
                },
              ].map((item, i) => (
                <div key={i} className="col-6 mb-3">
                  <div className="border rounded p-3 bg-light">
                    <i
                      className={`${item.icon} fs-3 text-${item.color} mb-2 d-block`}
                    />
                    <h4 className={`text-${item.color}`}>{item.value}</h4>
                    <small className="text-muted">{item.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Common Tags */}
      <div className="col-xl-8 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-hashtag me-2 text-info" />
              Tags thường dùng
            </h5>
          </div>
          <div className="card-body">
            {stats?.journalAnalytics?.commonTags?.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {stats.journalAnalytics.commonTags.map((tag, i) => (
                  <span key={i} className="badge bg-primary fs-6 py-2 px-3">
                    <i className="ri-hashtag me-1" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="ri-hashtag"
                message="Chưa có tags"
                description="Tags sẽ xuất hiện khi bạn thêm vào nhật ký"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGrowthTab = () => {
    const completionRate = stats?.personalGrowth?.taskCompletionRate || 0;

    return (
      <div className="row">
        {/* Task Pie Chart */}
        <div className="col-xl-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">
                <i className="ri-todo-line me-2 text-success" />
                Phân tích nhiệm vụ
              </h5>
            </div>
            <div className="card-body">
              {personalGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={personalGrowthData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {personalGrowthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon="ri-todo-line"
                  message="Chưa có dữ liệu nhiệm vụ"
                  description="Tạo và hoàn thành nhiệm vụ để xem phân tích"
                />
              )}
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="col-xl-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">
                <i className="ri-progress-4-line me-2 text-primary" />
                Tiến độ hoàn thành
              </h5>
            </div>
            <div className="card-body">
              <div className="text-center py-4">
                <div className="position-relative d-inline-block">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                    style={{
                      width: 150,
                      height: 150,
                      background: `conic-gradient(${CHART_COLORS.success} 0% ${completionRate}%, #e9ecef ${completionRate}% 100%)`,
                    }}
                  >
                    <div
                      className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: 120, height: 120 }}
                    >
                      <div>
                        <span className="h2 mb-0 text-dark d-block">
                          {completionRate}%
                        </span>
                        <small className="text-muted">Hoàn thành</small>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-muted mb-0">
                  {stats?.personalGrowth?.completedTasks || 0} /{" "}
                  {stats?.personalGrowth?.totalTasks || 0} nhiệm vụ đã hoàn
                  thành
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        {stats?.personalGrowth?.priorityBreakdown &&
          Object.keys(stats.personalGrowth.priorityBreakdown).length > 0 && (
            <div className="col-12 mb-4">
              <div className="card shadow-sm">
                <div className="card-header bg-transparent">
                  <h5 className="card-title mb-0">
                    <i className="ri-flag-line me-2 text-warning" />
                    Phân bố theo độ ưu tiên
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {Object.entries(stats.personalGrowth.priorityBreakdown).map(
                      ([priority, count]) => {
                        const priorityConfig = {
                          high: {
                            label: "Cao",
                            color: "danger",
                            icon: "ri-arrow-up-line",
                          },
                          medium: {
                            label: "Trung bình",
                            color: "warning",
                            icon: "ri-subtract-line",
                          },
                          low: {
                            label: "Thấp",
                            color: "info",
                            icon: "ri-arrow-down-line",
                          },
                        };
                        const config = priorityConfig[priority] || {
                          label: priority,
                          color: "secondary",
                          icon: "ri-checkbox-blank-line",
                        };

                        return (
                          <div key={priority} className="col-md-4 mb-3">
                            <div
                              className={`card border-${config.color} h-100`}
                            >
                              <div className="card-body text-center">
                                <i
                                  className={`${config.icon} fs-2 text-${config.color} mb-2 d-block`}
                                />
                                <h4 className={`text-${config.color}`}>
                                  {count}
                                </h4>
                                <small className="text-muted">
                                  Ưu tiên {config.label}
                                </small>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Insights */}
        {stats?.insights?.length > 0 && (
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-transparent">
                <h5 className="card-title mb-0">
                  <i className="ri-lightbulb-line me-2 text-warning" />
                  Gợi ý phát triển cá nhân
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {stats.insights.map((insight, i) => (
                    <div key={i} className="col-md-6 mb-3">
                      <div className="card border-0 bg-light h-100">
                        <div className="card-body d-flex">
                          <i className="ri-checkbox-circle-line text-success me-2 mt-1" />
                          <p className="mb-0">{insight}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSocialTab = () => (
    <div className="row">
      {/* Social Support Stats */}
      <div className="col-xl-6 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-heart-line me-2 text-danger" />
              Tương tác tích cực
            </h5>
          </div>
          <div className="card-body">
            {socialSupportData ? (
              <div className="row text-center">
                {[
                  {
                    value:
                      socialSupportData.positiveInteractions?.totalLikes || 0,
                    label: "Lượt thích nhận được",
                    color: "danger",
                    icon: "ri-heart-fill",
                  },
                  {
                    value:
                      socialSupportData.positiveInteractions?.totalComments ||
                      0,
                    label: "Bình luận nhận được",
                    color: "info",
                    icon: "ri-chat-3-fill",
                  },
                  {
                    value:
                      socialSupportData.positiveInteractions?.avgEngagement?.toFixed(
                        1
                      ) || "0",
                    label: "Tương tác TB/bài",
                    color: "success",
                    icon: "ri-bar-chart-fill",
                  },
                  {
                    value:
                      socialSupportData.receivedSupport?.uniqueSupporters || 0,
                    label: "Người ủng hộ",
                    color: "primary",
                    icon: "ri-user-heart-fill",
                  },
                ].map((item, i) => (
                  <div key={i} className="col-6 mb-3">
                    <div className="border rounded p-3 bg-light">
                      <i
                        className={`${item.icon} fs-3 text-${item.color} mb-2 d-block`}
                      />
                      <h4 className={`text-${item.color}`}>{item.value}</h4>
                      <small className="text-muted">{item.label}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="ri-heart-line"
                message="Chưa có dữ liệu tương tác"
              />
            )}
          </div>
        </div>
      </div>

      {/* Group & Message Support */}
      <div className="col-xl-6 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-group-line me-2 text-primary" />
              Hỗ trợ cộng đồng
            </h5>
          </div>
          <div className="card-body">
            {socialSupportData ? (
              <div className="row text-center">
                {[
                  {
                    value: socialSupportData.groupSupport?.totalGroups || 0,
                    label: "Nhóm tham gia",
                    color: "primary",
                    icon: "ri-group-fill",
                  },
                  {
                    value: socialSupportData.groupSupport?.activeGroups || 0,
                    label: "Nhóm hoạt động",
                    color: "success",
                    icon: "ri-checkbox-circle-fill",
                  },
                  {
                    value: socialSupportData.messageSupport?.totalMessages || 0,
                    label: "Tin nhắn đã gửi",
                    color: "info",
                    icon: "ri-message-3-fill",
                  },
                  {
                    value: socialSupportData.messageSupport?.uniqueChats || 0,
                    label: "Cuộc trò chuyện",
                    color: "warning",
                    icon: "ri-chat-private-fill",
                  },
                ].map((item, i) => (
                  <div key={i} className="col-6 mb-3">
                    <div className="border rounded p-3 bg-light">
                      <i
                        className={`${item.icon} fs-3 text-${item.color} mb-2 d-block`}
                      />
                      <h4 className={`text-${item.color}`}>{item.value}</h4>
                      <small className="text-muted">{item.label}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="ri-group-line" message="Chưa có dữ liệu" />
            )}
          </div>
        </div>
      </div>

      {/* Online Activity Patterns */}
      {behaviorData?.onlinePatterns?.length > 0 && (
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">
                <i className="ri-time-line me-2 text-info" />
                Thời gian hoạt động (theo giờ)
              </h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={behaviorData.onlinePatterns.map((p) => ({
                    hour: `${p._id}h`,
                    count: p.messageCount,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.info}
                    name="Tin nhắn"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Preferred Activity Times */}
      {behaviorData?.preferredActivityTimes?.length > 0 && (
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">
                <i className="ri-fire-line me-2 text-warning" />
                Giờ hoạt động cao điểm
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {behaviorData.preferredActivityTimes.map((time, i) => (
                  <div key={i} className="col-md-4 mb-3">
                    <div className="card bg-light border-0">
                      <div className="card-body text-center">
                        <i className="ri-time-line fs-2 text-warning mb-2 d-block" />
                        <h5 className="text-warning">{time.hour}:00</h5>
                        <small className="text-muted">
                          {time.count} hoạt động
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRecentActivity = () => (
    <div className="row mt-4">
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-header bg-transparent">
            <h5 className="card-title mb-0">
              <i className="ri-history-line me-2" />
              Hoạt động gần đây
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Nội dung</th>
                    <th>Thời gian</th>
                    <th>Tương tác</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentActivity?.posts?.length > 0 ? (
                    stats.recentActivity.posts.slice(0, 5).map((post) => (
                      <tr key={post._id}>
                        <td>
                          <span className="badge bg-success">
                            <i className="ri-file-text-line me-1" />
                            Bài viết
                          </span>
                        </td>
                        <td>
                          <p
                            className="mb-0 text-truncate"
                            style={{ maxWidth: 300 }}
                            title={post.content}
                          >
                            {post.content?.substring(0, 100)}
                            {post.content?.length > 100 && "..."}
                          </p>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(post.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-3">
                            <small className="text-muted">
                              <i className="ri-heart-line me-1" />
                              {post.likes?.length || 0}
                            </small>
                            <small className="text-muted">
                              <i className="ri-chat-3-line me-1" />
                              {post.comments?.length || 0}
                            </small>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        <EmptyState
                          icon="ri-history-line"
                          message="Chưa có hoạt động gần đây"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "emotions":
        return renderEmotionsTab();
      case "journal":
        return renderJournalTab();
      case "growth":
        return renderGrowthTab();
      case "social":
        return renderSocialTab();
      default:
        return renderOverviewTab();
    }
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="h3 mb-1 fw-bold">Thống Kê Cá Nhân</h1>
              <p className="text-muted mb-0">
                Chào mừng,{" "}
                <strong className="text-primary">{user?.username}</strong>!
                {stats?.filter?.label && (
                  <span className="ms-2">({stats.filter.label})</span>
                )}
              </p>
            </div>
            <PeriodSelector
              value={filter.period}
              onChange={handleFilterChange}
              loading={localLoading}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {localError && (
        <div className="row mb-4">
          <div className="col-12">
            <div
              className="alert alert-danger d-flex align-items-center"
              role="alert"
            >
              <i className="ri-error-warning-line me-2 fs-5" />
              <div>{localError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {localLoading ? (
        <LoadingState />
      ) : stats ? (
        <>
          {/* Tab Navigation */}
          <div className="row mb-4">
            <div className="col-12">
              <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                stats={stats}
              />
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Recent Activity */}
          {renderRecentActivity()}
        </>
      ) : (
        <EmptyState
          icon="ri-database-2-line"
          message="Không có dữ liệu"
          description="Vui lòng thử lại sau"
        />
      )}
    </div>
  );
};

export default UserStatistical;
