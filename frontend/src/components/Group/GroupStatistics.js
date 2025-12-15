// components/Group/GroupStatistics.js
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Button,
  ButtonGroup,
  Dropdown,
  Form,
  Spinner,
  Alert,
  Badge,
  ProgressBar,
  Table,
  Modal,
} from "react-bootstrap";
import {
  Users,
  FileText,
  Heart,
  MessageSquare,
  TrendingUp,
  Calendar,
  Clock,
  BarChart2,
  Download,
  Filter,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  UserPlus,
  AlertCircle,
  Hash,
  Tag,
  Smile,
  Activity,
} from "lucide-react";
import api from "../../services/api";
import groupService from "../../services/groupService";
import NotificationService from "../../services/notificationService";
import "./GroupStatistics.css";
import { useParams } from "react-router-dom";

const GroupStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");

  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [errorGroup, setErrorGroup] = useState("");

  console.log("groupId:", groupId);

  // Màu sắc cho biểu đồ
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];
  const EMOTION_COLORS = {
    happy: "#FFD700",
    sad: "#4169E1",
    angry: "#DC143C",
    surprised: "#32CD32",
    fearful: "#8B4513",
    disgusted: "#800080",
    neutral: "#808080",
    all: "#A9A9A9",
  };

  // Lấy thống kê
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError("");

      let endpoint = "";
      switch (activeTab) {
        case "overview":
          endpoint = `/api/groups/${groupId}/statistics`;
          break;
        case "members":
          endpoint = `/api/groups/${groupId}/analytics/members`;
          break;
        case "content":
          endpoint = `/api/groups/${groupId}/analytics/content?period=${period}`;
          break;
        default:
          endpoint = `/api/groups/${groupId}/statistics`;
      }

      const response = await api.get(endpoint);

      if (response.data.success) {
        setStatistics(response.data);
      } else {
        throw new Error(response.data.message || "Không thể lấy thống kê");
      }
    } catch (err) {
      console.error("Lỗi khi lấy thống kê:", err);
      setError(
        err.response?.data?.message || err.message || "Lỗi khi tải dữ liệu"
      );
      NotificationService.error({
        title: "Lỗi",
        text: "Không thể tải thống kê",
      });
    } finally {
      setLoading(false);
    }
  };

  // Xuất báo cáo
  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await api.get(`/api/groups/${groupId}/report/export`, {
        params: { format: exportFormat, period },
        responseType: exportFormat === "json" ? "json" : "blob",
      });

      if (exportFormat === "json") {
        // Tải JSON
        const dataStr = JSON.stringify(response.data.report, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `group-report-${groupId}-${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
      } else {
        // Tải file PDF/Excel
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.download = `group-report-${groupId}-${
          new Date().toISOString().split("T")[0]
        }.${exportFormat}`;
        link.click();
      }

      NotificationService.success({
        title: "Thành công",
        text: "Đã xuất báo cáo thành công",
      });

      setShowExportModal(false);
    } catch (err) {
      console.error("Lỗi khi xuất báo cáo:", err);
      NotificationService.error({
        title: "Lỗi",
        text: "Không thể xuất báo cáo",
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchStatistics();
    }
  }, [groupId, activeTab, period]);

  useEffect(() => {
    if (groupId) {
      loadGroup(groupId);
    }
  }, [groupId]);

  const loadGroup = async (groupId) => {
    if (groupId) {
      try {
        setLoadingGroup(true);
        const response = await groupService.getGroup(groupId);

        if (response.success) {
          setGroup(response.group);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải thông tin nhóm");
      } finally {
        setLoadingGroup(false);
      }
    }
  };

  // Format số
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Format phần trăm
  const formatPercent = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  // Format ngày
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (!groupId) {
    return (
      <Alert variant="warning">
        <AlertCircle className="me-2" />
        Chỉ owner và moderator mới có quyền xem thống kê
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <AlertCircle className="me-2" />
        {error}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-3"
          onClick={fetchStatistics}
        >
          <RefreshCw size={14} /> Thử lại
        </Button>
      </Alert>
    );
  }

  // Component Overview Tab
  const OverviewTab = () => {
    const stats = statistics?.statistics || {};

    return (
      <div>
        {/* Thông tin tổng quan */}
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card h-100">
              <CardBody className="text-center">
                <div className="stat-icon mb-2">
                  <Users size={24} className="text-primary" />
                </div>
                <h3 className="stat-value">
                  {formatNumber(stats.overview?.memberCount)}
                </h3>
                <p className="stat-label">Thành viên</p>
                <Badge bg="success" className="mt-2">
                  +
                  {formatNumber(
                    stats.members?.growth?.[stats.members.growth.length - 1]
                      ?.newMembers || 0
                  )}{" "}
                  tháng này
                </Badge>
              </CardBody>
            </Card>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card h-100">
              <CardBody className="text-center">
                <div className="stat-icon mb-2">
                  <FileText size={24} className="text-success" />
                </div>
                <h3 className="stat-value">
                  {formatNumber(stats.overview?.postCount)}
                </h3>
                <p className="stat-label">Bài viết</p>
                <div className="mt-2">
                  <small className="text-muted">
                    {formatNumber(stats.overview?.weeklyGrowth)} tuần này
                  </small>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card h-100">
              <CardBody className="text-center">
                <div className="stat-icon mb-2">
                  <Heart size={24} className="text-danger" />
                </div>
                <h3 className="stat-value">
                  {formatNumber(stats.interactions?.totalLikes)}
                </h3>
                <p className="stat-label">Lượt thích</p>
                <div className="mt-2">
                  <small className="text-muted">
                    {formatNumber(stats.interactions?.avgLikes?.toFixed(1))} /
                    bài
                  </small>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card h-100">
              <CardBody className="text-center">
                <div className="stat-icon mb-2">
                  <MessageSquare size={24} className="text-info" />
                </div>
                <h3 className="stat-value">
                  {formatNumber(stats.interactions?.totalComments)}
                </h3>
                <p className="stat-label">Bình luận</p>
                <div className="mt-2">
                  <small className="text-muted">
                    {formatNumber(stats.interactions?.avgComments?.toFixed(1))}{" "}
                    / bài
                  </small>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Biểu đồ hoạt động */}
        <Row className="mb-4">
          <Col lg={8} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <TrendingUp size={18} className="me-2" />
                  Hoạt động theo thời gian
                </h5>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.posts?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Bài viết"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Col>

          <Col lg={4} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <Users size={18} className="me-2" />
                  Phân bố trạng thái
                </h5>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.members?.byStatus || {}).map(
                        ([name, value]) => ({
                          name:
                            name === "active"
                              ? "Hoạt động"
                              : name === "pending"
                              ? "Chờ duyệt"
                              : "Bị cấm",
                          value,
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(stats.members?.byStatus || {}).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Top tác giả */}
        <Row className="mb-4">
          <Col lg={6} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <UserCheck size={18} className="me-2" />
                  Top tác giả tích cực
                </h5>
              </CardHeader>
              <CardBody>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tác giả</th>
                      <th className="text-end">Bài viết</th>
                      <th className="text-end">Tương tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topAuthors?.slice(0, 5).map((author, index) => (
                      <tr key={author.userId}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={
                                author.avatar ||
                                "/assets/images/default-avatar.png"
                              }
                              alt={author.username}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                            <div>
                              <div className="fw-bold">
                                {author.fullName || author.username}
                              </div>
                              <small className="text-muted">
                                {author.role || "Thành viên"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-end">
                          <Badge bg="primary">{author.postCount}</Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Badge
                              bg="success"
                              className="d-flex align-items-center gap-1"
                            >
                              <Heart size={12} /> {author.totalLikes}
                            </Badge>
                            <Badge
                              bg="info"
                              className="d-flex align-items-center gap-1"
                            >
                              <MessageSquare size={12} /> {author.totalComments}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>

          {/* Phân bố cảm xúc */}
          <Col lg={6} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <Smile size={18} className="me-2" />
                  Phân bố cảm xúc
                </h5>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.emotions || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Số bài viết">
                      {stats.emotions?.map((emotion, index) => (
                        <Cell
                          key={`emotion-${index}`}
                          fill={
                            EMOTION_COLORS[emotion._id] ||
                            COLORS[index % COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3">
                  <Row>
                    {stats.emotions?.slice(0, 6).map((emotion) => (
                      <Col key={emotion._id} xs={4} className="mb-2">
                        <div className="d-flex align-items-center">
                          <div
                            className="emotion-dot me-2"
                            style={{
                              backgroundColor:
                                EMOTION_COLORS[emotion._id] || "#ccc",
                            }}
                          />
                          <span className="text-capitalize">{emotion._id}</span>
                          <Badge bg="light" text="dark" className="ms-auto">
                            {emotion.count}
                          </Badge>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Hoạt động theo giờ */}
        <Row>
          <Col md={12}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">
                  <Clock size={18} className="me-2" />
                  Thời gian hoạt động cao điểm
                </h5>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={8}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.activityPatterns?.byHour || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="_id"
                          label={{
                            value: "Giờ trong ngày",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          label={{
                            value: "Số bài viết",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Số bài viết"
                          fill="#82ca9d"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col md={4} className="d-flex align-items-center">
                    <div className="text-center w-100">
                      <h2 className="display-4">
                        {stats.activityPatterns?.peakHour?._id || 0}:00
                      </h2>
                      <p className="text-muted">Giờ cao điểm</p>
                      <Badge bg="success">
                        {stats.activityPatterns?.peakHour?.count || 0} bài viết
                      </Badge>
                      <p className="mt-3 small text-muted">
                        Thời gian hoạt động nhiều nhất trong ngày
                      </p>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Component Members Tab
  const MembersTab = () => {
    const analytics = statistics?.analytics || {};

    return (
      <div>
        {/* Tổng quan thành viên */}
        <Row className="mb-4">
          <Col lg={8} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <UserPlus size={18} className="me-2" />
                  Tăng trưởng thành viên
                </h5>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newMembers"
                      name="Thành viên mới"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Col>

          <Col lg={4} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <UserCheck size={18} className="me-2" />
                  Tỷ lệ giữ chân
                </h5>
              </CardHeader>
              <CardBody className="d-flex flex-column justify-content-center">
                {analytics.retentionStats?.map((stat, index) => (
                  <div key={stat.month} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small">{stat.month}</span>
                      <span className="small fw-bold">
                        {stat.retentionRate.toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar
                      now={stat.retentionRate}
                      variant={
                        stat.retentionRate >= 80
                          ? "success"
                          : stat.retentionRate >= 60
                          ? "warning"
                          : "danger"
                      }
                      label={`${stat.retentionRate.toFixed(1)}%`}
                    />
                    <div className="d-flex justify-content-between mt-1 small text-muted">
                      <span>Tham gia: {stat.joined}</span>
                      <span>Còn lại: {stat.active}</span>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Phân bố vai trò */}
        <Row className="mb-4">
          <Col lg={6} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <Users size={18} className="me-2" />
                  Phân bố vai trò
                </h5>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.roleDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analytics.roleDistribution || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3">
                  {(analytics.roleDistribution || []).map((role) => (
                    <div
                      key={role._id}
                      className="d-flex justify-content-between mb-2"
                    >
                      <span className="text-capitalize">
                        {role.role === "owner"
                          ? "Chủ nhóm"
                          : role.role === "moderator"
                          ? "Quản trị viên"
                          : "Thành viên"}
                      </span>
                      <div>
                        <Badge bg="primary">{role.count}</Badge>
                        <span className="ms-2 text-muted small">
                          ({role.percentage?.toFixed(1) || 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Thành viên mới nhất */}
          <Col lg={6} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <UserPlus size={18} className="me-2" />
                  Thành viên mới nhất
                </h5>
              </CardHeader>
              <CardBody>
                <div className="list-group">
                  {analytics.recentMembers?.map((member) => (
                    <div
                      key={member._id}
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <img
                            src={
                              member.userId?.profile?.avatar ||
                              "/assets/images/default-avatar.png"
                            }
                            alt={member.userId?.username}
                            className="rounded-circle me-3"
                            width="40"
                            height="40"
                          />
                          <div>
                            <h6 className="mb-0">
                              {member.userId?.fullName ||
                                member.userId?.username}
                            </h6>
                            <small className="text-muted">
                              @{member.userId?.username}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <small className="text-muted d-block">
                            {new Date(member.joinedAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </small>
                          <Badge
                            bg={
                              member.role === "owner"
                                ? "warning"
                                : member.role === "moderator"
                                ? "info"
                                : "secondary"
                            }
                          >
                            {member.role === "owner"
                              ? "Chủ nhóm"
                              : member.role === "moderator"
                              ? "Quản trị viên"
                              : "Thành viên"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Thành viên tích cực */}
        <Row>
          <Col md={12}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">
                  <Activity size={18} className="me-2" />
                  Thành viên tích cực nhất
                </h5>
              </CardHeader>
              <CardBody>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Thành viên</th>
                      <th>Điểm hoạt động</th>
                      <th className="text-end">Bài viết</th>
                      <th className="text-end">Likes nhận</th>
                      <th className="text-end">Comments nhận</th>
                      <th>Hoạt động gần nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.activeMembers?.map((member, index) => (
                      <tr key={member.userId}>
                        <td>
                          <Badge bg={index < 3 ? "warning" : "secondary"}>
                            {index + 1}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={
                                member.avatar ||
                                "/assets/images/default-avatar.png"
                              }
                              alt={member.username}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                            <div>
                              <div className="fw-bold">
                                {member.fullName || member.username}
                              </div>
                              <small className="text-muted">
                                {member.role}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <ProgressBar
                            now={member.activityScore}
                            max={
                              analytics.activeMembers?.[0]?.activityScore || 100
                            }
                            variant="success"
                            label={`${Math.round(member.activityScore)}`}
                          />
                        </td>
                        <td className="text-end">
                          <Badge bg="primary">{member.postCount}</Badge>
                        </td>
                        <td className="text-end">
                          <Badge bg="success">
                            {member.totalLikesReceived}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Badge bg="info">
                            {member.totalCommentsReceived}
                          </Badge>
                        </td>
                        <td>
                          {member.lastActivity
                            ? new Date(member.lastActivity).toLocaleDateString(
                                "vi-VN"
                              )
                            : "Chưa có"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Component Content Tab
  const ContentTab = () => {
    const analytics = statistics?.analytics || {};

    return (
      <div>
        <Row className="mb-4">
          <Col lg={8} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <TrendingUp size={18} className="me-2" />
                    Xu hướng bài viết
                  </h5>
                  <div>
                    <Badge bg="primary" className="me-2">
                      Tổng: {analytics.summary?.totalPostsAnalyzed || 0}
                    </Badge>
                    <Badge bg="success">
                      Trung bình:{" "}
                      {analytics.summary?.avgDailyPosts?.toFixed(1) || 0}/ngày
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="postCount"
                      name="Số bài viết"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgEngagement"
                      name="Tương tác trung bình"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Col>

          <Col lg={4} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <BarChart2 size={18} className="me-2" />
                  Loại nội dung
                </h5>
              </CardHeader>

              <CardBody className="d-flex flex-column justify-content-center">
                {(() => {
                  const byContentType =
                    analytics.postTypes?.[0]?.byContentType || [];

                  const fileTypeDistribution =
                    analytics.postTypes?.[0]?.fileTypeDistribution || [];

                  const totalPosts =
                    byContentType.reduce((sum, t) => sum + t.count, 0) || 1;

                  const contentTypeLabel = {
                    text_only: "Chỉ văn bản",
                    media_only: "Chỉ phương tiện",
                    mixed: "Hỗn hợp",
                    empty: "Trống",
                  };

                  const contentTypeVariant = {
                    text_only: "success",
                    media_only: "warning",
                    mixed: "info",
                    empty: "secondary",
                  };

                  const fileTypeLabel = {
                    image: "Hình ảnh",
                    video: "Video",
                    audio: "Audio",
                    file: "Tệp",
                    text: "Văn bản",
                  };

                  return (
                    <>
                      {/* === PHÂN LOẠI NỘI DUNG === */}
                      {byContentType.map((type) => (
                        <div key={type._id} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="small">
                              {contentTypeLabel[type._id] || "Không xác định"}
                            </span>
                            <span className="small fw-bold">{type.count}</span>
                          </div>

                          <ProgressBar
                            now={type.count}
                            max={totalPosts}
                            variant={contentTypeVariant[type._id] || "primary"}
                            label={`${((type.count / totalPosts) * 100).toFixed(
                              1
                            )}%`}
                          />
                        </div>
                      ))}

                      <hr />

                      {/* === PHÂN LOẠI FILE === */}
                      <h6 className="mb-3">Loại file đính kèm:</h6>

                      {fileTypeDistribution.length > 0 ? (
                        fileTypeDistribution.map((fileType) => (
                          <div
                            key={fileType._id}
                            className="d-flex justify-content-between mb-2"
                          >
                            <span className="small">
                              {fileTypeLabel[fileType._id] || "Khác"}
                            </span>
                            <Badge bg="secondary">{fileType.count}</Badge>
                          </div>
                        ))
                      ) : (
                        <small className="text-muted">
                          Không có file đính kèm
                        </small>
                      )}
                    </>
                  );
                })()}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Phân tích tương tác */}
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">
                  <Activity size={18} className="me-2" />
                  Phân tích tương tác
                </h5>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={4} className="text-center">
                    <div className="display-4 mb-2">
                      {analytics.interactions?.avgLikes?.toFixed(1) || 0}
                    </div>
                    <p className="text-muted">Likes trung bình / bài</p>
                    <ProgressBar
                      now={(analytics.interactions?.avgLikes || 0) * 20}
                      variant="success"
                      style={{ height: "10px" }}
                    />
                  </Col>

                  <Col md={4} className="text-center">
                    <div className="display-4 mb-2">
                      {analytics.interactions?.avgComments?.toFixed(1) || 0}
                    </div>
                    <p className="text-muted">Comments trung bình / bài</p>
                    <ProgressBar
                      now={(analytics.interactions?.avgComments || 0) * 20}
                      variant="info"
                      style={{ height: "10px" }}
                    />
                  </Col>

                  <Col md={4} className="text-center">
                    <div className="display-4 mb-2">
                      {analytics.interactions?.avgEngagement?.toFixed(1) || 0}
                    </div>
                    <p className="text-muted">Tương tác trung bình / bài</p>
                    <ProgressBar
                      now={analytics.interactions?.avgEngagement || 0}
                      variant="primary"
                      style={{ height: "10px" }}
                    />
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Top tags và emotions */}
        <Row>
          <Col lg={6} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <Hash size={18} className="me-2" />
                  Tags phổ biến
                </h5>
              </CardHeader>
              <CardBody>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {analytics.tags?.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag._id}
                      bg="primary"
                      className="p-2 d-flex align-items-center"
                      style={{ fontSize: "0.9rem" }}
                    >
                      <Tag size={12} className="me-1" />
                      {tag._id}
                      <Badge bg="light" text="dark" className="ms-2">
                        {tag.count}
                      </Badge>
                    </Badge>
                  ))}
                </div>
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th className="text-end">Số bài</th>
                      <th className="text-end">Likes TB</th>
                      <th className="text-end">Comments TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.tags?.slice(0, 5).map((tag) => (
                      <tr key={tag._id}>
                        <td className="fw-bold">#{tag._id}</td>
                        <td className="text-end">{tag.count}</td>
                        <td className="text-end">{tag.avgLikes?.toFixed(1)}</td>
                        <td className="text-end">
                          {tag.avgComments?.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>

          <Col lg={6} className="mb-3">
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">
                  <Smile size={18} className="me-2" />
                  Cảm xúc phổ biến
                </h5>
              </CardHeader>
              <CardBody>
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.emotions || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Số bài viết">
                        {analytics.emotions?.map((emotion, index) => (
                          <Cell
                            key={`emotion-${index}`}
                            fill={
                              EMOTION_COLORS[emotion._id] ||
                              COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Cảm xúc</th>
                      <th className="text-end">Số bài</th>
                      <th className="text-end">Likes TB</th>
                      <th className="text-end">Comments TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.emotions?.slice(0, 5).map((emotion) => (
                      <tr key={emotion._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="emotion-dot me-2"
                              style={{
                                backgroundColor:
                                  EMOTION_COLORS[emotion._id] || "#ccc",
                              }}
                            />
                            <span className="text-capitalize">
                              {emotion._id}
                            </span>
                          </div>
                        </td>
                        <td className="text-end">{emotion.count}</td>
                        <td className="text-end">
                          {emotion.avgLikes?.toFixed(1)}
                        </td>
                        <td className="text-end">
                          {emotion.avgComments?.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="group-statistics">
      {/* Header */}
      <Card className="mb-4">
        <CardBody>
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0">
                <BarChart2 className="me-2" />
                Thống kê nhóm
              </h3>
              <p className="text-muted mb-0">
                Phân tích hoạt động và hiệu suất của nhóm
              </p>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <ButtonGroup>
                  <Button
                    variant={
                      activeTab === "overview" ? "primary" : "outline-primary"
                    }
                    onClick={() => setActiveTab("overview")}
                  >
                    Tổng quan
                  </Button>
                  <Button
                    variant={
                      activeTab === "members" ? "primary" : "outline-primary"
                    }
                    onClick={() => setActiveTab("members")}
                  >
                    Thành viên
                  </Button>
                  <Button
                    variant={
                      activeTab === "content" ? "primary" : "outline-primary"
                    }
                    onClick={() => setActiveTab("content")}
                  >
                    Nội dung
                  </Button>
                </ButtonGroup>

                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    <Filter size={16} className="me-2" />
                    {period === "day"
                      ? "Hôm nay"
                      : period === "week"
                      ? "Tuần này"
                      : period === "month"
                      ? "Tháng này"
                      : "Năm nay"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setPeriod("day")}>
                      Hôm nay
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setPeriod("week")}>
                      Tuần này
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setPeriod("month")}>
                      Tháng này
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setPeriod("year")}>
                      Năm nay
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <Button
                  variant="success"
                  onClick={() => setShowExportModal(true)}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <Download size={16} className="me-2" />
                      Xuất báo cáo
                    </>
                  )}
                </Button>

                <Button
                  variant="outline-secondary"
                  onClick={fetchStatistics}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* group */}
      {groupId && (
        <>
          {loadingGroup ? (
            // --- Trạng thái loading ---
            <div className="group-info-card d-flex justify-content-center align-items-center p-4 mb-2">
              <div className="text-center text-light">
                <div
                  className="spinner-border text-light mb-2"
                  role="status"
                ></div>
                <div>Đang tải thông tin nhóm...</div>
              </div>
            </div>
          ) : (
            // --- Thông tin nhóm ---
            <div
              className="group-info-card text-white mb-3"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${
                  group?.coverPhoto ||
                  group?.avatar ||
                  "/assets/images/default-cover.jpg"
                })`,
              }}
            >
              <div className="group-info-content d-flex align-items-center p-3">
                <img
                  src={group?.avatar || "/assets/images/default-avatar.png"}
                  alt="Avatar"
                  className="group-avatar-create me-3"
                />

                <div className="group-details">
                  <div className="group-name fw-bold mb-1">{group?.name}</div>

                  <div className="group-description text-light small mb-2">
                    {group?.description || "Không có mô tả"}
                  </div>

                  <div className="group-meta small text-light-50">
                    <span>{group?.memberCount ?? 0} thành viên</span>
                    <span className="mx-2">•</span>
                    <span>
                      {group?.visibility === "public"
                        ? "Công khai"
                        : group?.visibility === "private"
                        ? "Riêng tư"
                        : "Chỉ mời"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "members" && <MembersTab />}
      {activeTab === "content" && <ContentTab />}

      {/* Export Modal */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xuất báo cáo thống kê</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Định dạng xuất</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="json-format"
                  label="JSON"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                />
                <Form.Check
                  type="radio"
                  id="pdf-format"
                  label="PDF"
                  checked={exportFormat === "pdf"}
                  onChange={() => setExportFormat("pdf")}
                  disabled
                />
                <Form.Check
                  type="radio"
                  id="excel-format"
                  label="Excel"
                  checked={exportFormat === "excel"}
                  onChange={() => setExportFormat("excel")}
                  disabled
                />
              </div>
              <Form.Text className="text-muted">
                Hiện tại chỉ hỗ trợ xuất JSON. PDF và Excel đang phát triển.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời gian</Form.Label>
              <Form.Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="day">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm nay</option>
              </Form.Select>
            </Form.Group>

            <Alert variant="info">
              <Eye className="me-2" />
              Báo cáo sẽ bao gồm tất cả dữ liệu thống kê hiện có cho nhóm này.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang xuất...
              </>
            ) : (
              <>
                <Download className="me-2" />
                Xuất báo cáo
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GroupStatistics;
