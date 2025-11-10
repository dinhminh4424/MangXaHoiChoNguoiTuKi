// // src/components/settings/ActivityTab.js
// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Form,
//   Row,
//   Col,
//   Button,
//   Badge,
//   Pagination,
//   Alert,
//   Accordion,
// } from "react-bootstrap";
// import { accountService } from "../../services/accountService";

// const ActivityTab = () => {
//   const [logs, setLogs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filters, setFilters] = useState({
//     page: 1,
//     limit: 10,
//     action: "",
//     startDate: "",
//     endDate: "",
//   });
//   const [pagination, setPagination] = useState({
//     current: 1,
//     total: 1,
//     results: 0,
//     totalLogs: 0,
//   });

//   useEffect(() => {
//     fetchActivityLogs();
//   }, [filters]);

//   const fetchActivityLogs = async () => {
//     try {
//       const response = await accountService.getActivityLogs(filters);
//       setLogs(response.data.data.logs);
//       setPagination(response.data.data.pagination);
//     } catch (error) {
//       console.error("Lỗi khi lấy lịch sử hoạt động:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: value,
//       page: 1, // Reset về trang đầu khi thay đổi filter
//     }));
//   };

//   const handlePageChange = (page) => {
//     setFilters((prev) => ({ ...prev, page }));
//   };

//   const clearFilters = () => {
//     setFilters({
//       page: 1,
//       limit: 10,
//       action: "",
//       startDate: "",
//       endDate: "",
//     });
//   };

//   const getEventType = (event) => {
//     if (event.includes("login")) return "success";
//     if (
//       event.includes("error") ||
//       event.includes("violation") ||
//       event.includes("failed")
//     )
//       return "danger";
//     if (event.includes("warning")) return "warning";
//     if (event.includes("view") || event.includes("read")) return "info";
//     if (event.includes("create") || event.includes("add")) return "primary";
//     if (event.includes("update") || event.includes("edit")) return "warning";
//     if (event.includes("delete") || event.includes("remove")) return "danger";
//     return "secondary";
//   };

//   const getEventIcon = (event) => {
//     if (event.includes("login")) return "fas fa-sign-in-alt";
//     if (event.includes("logout")) return "fas fa-sign-out-alt";
//     if (event.includes("update")) return "fas fa-edit";
//     if (event.includes("create")) return "fas fa-plus-circle";
//     if (event.includes("delete")) return "fas fa-trash";
//     if (event.includes("password")) return "fas fa-key";
//     if (event.includes("friend")) return "fas fa-user-friends";
//     if (event.includes("view") || event.includes("read")) return "fas fa-eye";
//     if (event.includes("profile")) return "fas fa-user";
//     if (event.includes("message")) return "fas fa-comments";
//     if (event.includes("search")) return "fas fa-search";
//     return "fas fa-history";
//   };

//   const getEventCategory = (event) => {
//     if (event.includes("friend")) return "Bạn bè";
//     if (
//       event.includes("login") ||
//       event.includes("logout") ||
//       event.includes("auth")
//     )
//       return "Xác thực";
//     if (event.includes("profile")) return "Hồ sơ";
//     if (event.includes("message")) return "Tin nhắn";
//     if (event.includes("post")) return "Bài viết";
//     if (event.includes("search")) return "Tìm kiếm";
//     if (event.includes("settings")) return "Cài đặt";
//     return "Khác";
//   };

//   const formatEventName = (event) => {
//     const eventMap = {
//       "friend.requests.view": "Xem yêu cầu kết bạn",
//       "friend.request.send": "Gửi yêu cầu kết bạn",
//       "friend.request.accept": "Chấp nhận kết bạn",
//       "friend.request.reject": "Từ chối kết bạn",
//       "user.login": "Đăng nhập",
//       "user.logout": "Đăng xuất",
//       "profile.update": "Cập nhật hồ sơ",
//       "password.change": "Đổi mật khẩu",
//       "message.send": "Gửi tin nhắn",
//       "post.create": "Tạo bài viết",
//       "post.view": "Xem bài viết",
//     };

//     return (
//       eventMap[event] ||
//       event
//         .split(".")
//         .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//         .join(" ")
//     );
//   };

//   const renderPayloadDetails = (payload, meta) => {
//     if (!payload && !meta) return null;

//     return (
//       <div className="payload-details mt-2">
//         {meta?.description && (
//           <div className="mb-2">
//             <strong>Mô tả:</strong> {meta.description}
//           </div>
//         )}

//         {payload && Object.keys(payload).length > 0 && (
//           <Accordion>
//             <Accordion.Item eventKey="0">
//               <Accordion.Header>
//                 <small>
//                   Chi tiết dữ liệu ({Object.keys(payload).length} trường)
//                 </small>
//               </Accordion.Header>
//               <Accordion.Body>
//                 <div className="small">
//                   {Object.entries(payload).map(([key, value]) => (
//                     <div key={key} className="d-flex mb-1">
//                       <span
//                         className="text-muted me-2"
//                         style={{ minWidth: "120px" }}
//                       >
//                         {formatKeyName(key)}:
//                       </span>
//                       <span className="flex-grow-1">
//                         {typeof value === "object"
//                           ? JSON.stringify(value)
//                           : String(value)}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </Accordion.Body>
//             </Accordion.Item>
//           </Accordion>
//         )}
//       </div>
//     );
//   };

//   const formatKeyName = (key) => {
//     const keyMap = {
//       type: "Loại",
//       count: "Số lượng",
//       userId: "ID người dùng",
//       targetId: "ID đối tượng",
//       ip: "Địa chỉ IP",
//       userAgent: "Trình duyệt",
//       correlationId: "ID tương quan",
//       url: "URL",
//       method: "Phương thức",
//       statusCode: "Mã trạng thái",
//       duration: "Thời gian",
//     };
//     return keyMap[key] || key;
//   };

//   const formatTimestamp = (timestamp) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffMs = now - date;
//     const diffMins = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMs / 3600000);
//     const diffDays = Math.floor(diffMs / 86400000);

//     if (diffMins < 1) return "Vừa xong";
//     if (diffMins < 60) return `${diffMins} phút trước`;
//     if (diffHours < 24) return `${diffHours} giờ trước`;
//     if (diffDays < 7) return `${diffDays} ngày trước`;

//     return date.toLocaleDateString("vi-VN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   if (loading) {
//     return (
//       <Card className="settings-card">
//         <Card.Body className="text-center py-5">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="mt-2 text-muted">Đang tải lịch sử hoạt động...</p>
//         </Card.Body>
//       </Card>
//     );
//   }

//   return (
//     <Card className="settings-card">
//       <Card.Header>
//         <div className="d-flex justify-content-between align-items-center">
//           <div>
//             <h4 className="mb-0">
//               <i className="fas fa-chart-line me-2"></i>
//               Lịch Sử Hoạt Động
//             </h4>
//           </div>
//           <div>
//             <Badge bg="primary ms-4 p-3" pill>
//               {pagination.totalLogs} hoạt động
//             </Badge>
//           </div>
//         </div>
//       </Card.Header>
//       <Card.Body>
//         {/* Filters */}
//         <Card className="mb-4">
//           <Card.Header>
//             <h6 className="mb-0">
//               <i className="fas fa-filter me-2"></i>
//               Bộ lọc
//             </h6>
//           </Card.Header>
//           <Card.Body>
//             <Row>
//               <Col md={3}>
//                 <Form.Group>
//                   <Form.Label>Hành động</Form.Label>
//                   <Form.Control
//                     type="text"
//                     placeholder="Tìm kiếm hành động..."
//                     value={filters.action}
//                     onChange={(e) =>
//                       handleFilterChange("action", e.target.value)
//                     }
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={2}>
//                 <Form.Group>
//                   <Form.Label>Từ ngày</Form.Label>
//                   <Form.Control
//                     type="date"
//                     value={filters.startDate}
//                     onChange={(e) =>
//                       handleFilterChange("startDate", e.target.value)
//                     }
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={2}>
//                 <Form.Group>
//                   <Form.Label>Đến ngày</Form.Label>
//                   <Form.Control
//                     type="date"
//                     value={filters.endDate}
//                     onChange={(e) =>
//                       handleFilterChange("endDate", e.target.value)
//                     }
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={2}>
//                 <Form.Group>
//                   <Form.Label>Số lượng</Form.Label>
//                   <Form.Select
//                     value={filters.limit}
//                     onChange={(e) =>
//                       handleFilterChange("limit", parseInt(e.target.value))
//                     }
//                   >
//                     <option value={10}>10 bản ghi</option>
//                     <option value={20}>20 bản ghi</option>
//                     <option value={50}>50 bản ghi</option>
//                   </Form.Select>
//                 </Form.Group>
//               </Col>
//               <Col md={3} className="d-flex align-items-end">
//                 <Button
//                   variant="outline-secondary"
//                   onClick={clearFilters}
//                   className="w-100"
//                 >
//                   <i className="fas fa-times me-2"></i>
//                   Xóa bộ lọc
//                 </Button>
//               </Col>
//             </Row>
//           </Card.Body>
//         </Card>

//         {/* Activity Logs */}
//         <div className="activity-logs">
//           {logs.length === 0 ? (
//             <Alert variant="info" className="text-center">
//               <i className="fas fa-info-circle me-2"></i>
//               Không có hoạt động nào được ghi nhận trong khoảng thời gian này
//             </Alert>
//           ) : (
//             logs.map((log, index) => (
//               <Card
//                 key={log._id || index}
//                 className={`mb-3 border-${getEventType(log.event)}`}
//               >
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-start">
//                     <div className="flex-grow-1">
//                       <div className="d-flex align-items-center mb-2">
//                         <div
//                           className={`icon-container bg-${getEventType(
//                             log.event
//                           )} me-3`}
//                         >
//                           <i
//                             className={`${getEventIcon(log.event)} text-white`}
//                           ></i>
//                         </div>
//                         <div className="flex-grow-1">
//                           <div className="d-flex align-items-center mb-1">
//                             <h6 className="mb-0 me-2">
//                               {formatEventName(log.event)}
//                             </h6>
//                             <Badge
//                               bg={getEventType(log.event)}
//                               className="me-2"
//                             >
//                               {getEventCategory(log.event)}
//                             </Badge>
//                             <small className="text-muted">
//                               {formatTimestamp(log.timestamp)}
//                             </small>
//                           </div>
//                           <div className="d-flex flex-wrap gap-2">
//                             <small className="text-muted">
//                               <i className="fas fa-clock me-1"></i>
//                               {new Date(log.timestamp).toLocaleString("vi-VN")}
//                             </small>
//                             {log.ip && (
//                               <small className="text-muted">
//                                 <i className="fas fa-globe me-1"></i>
//                                 {log.ip}
//                               </small>
//                             )}
//                             {log.url && (
//                               <small className="text-muted">
//                                 <i className="fas fa-link me-1"></i>
//                                 {log.url}
//                               </small>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {renderPayloadDetails(log.payload, log.meta)}
//                     </div>
//                   </div>
//                 </Card.Body>
//               </Card>
//             ))
//           )}
//         </div>

//         {/* Pagination */}
//         {pagination.total > 1 && (
//           <div className="d-flex justify-content-between align-items-center mt-4">
//             <div className="text-muted">
//               Hiển thị {logs.length} của {pagination.totalLogs} kết quả
//             </div>
//             <Pagination>
//               <Pagination.Prev
//                 disabled={filters.page === 1}
//                 onClick={() => handlePageChange(filters.page - 1)}
//               />

//               {[...Array(pagination.total)].map((_, i) => (
//                 <Pagination.Item
//                   key={i + 1}
//                   active={i + 1 === filters.page}
//                   onClick={() => handlePageChange(i + 1)}
//                 >
//                   {i + 1}
//                 </Pagination.Item>
//               ))}

//               <Pagination.Next
//                 disabled={filters.page === pagination.total}
//                 onClick={() => handlePageChange(filters.page + 1)}
//               />
//             </Pagination>
//           </div>
//         )}
//       </Card.Body>

//       <style jsx>{`
//         .icon-container {
//           width: 40px;
//           height: 40px;
//           border-radius: 8px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//         .payload-details {
//           border-left: 3px solid #dee2e6;
//           padding-left: 15px;
//         }
//         .card.border-success {
//           border-left: 4px solid #198754 !important;
//         }
//         .card.border-danger {
//           border-left: 4px solid #dc3545 !important;
//         }
//         .card.border-warning {
//           border-left: 4px solid #ffc107 !important;
//         }
//         .card.border-info {
//           border-left: 4px solid #0dcaf0 !important;
//         }
//         .card.border-primary {
//           border-left: 4px solid #0d6efd !important;
//         }
//       `}</style>
//     </Card>
//   );
// };

// export default ActivityTab;

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Button,
  Badge,
  Pagination,
  Alert,
  Accordion,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { accountService } from "../../services/accountService";

const ActivityTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    action: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    results: 0,
    totalLogs: 0,
  });

  useEffect(() => {
    fetchActivityLogs();
  }, [filters]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const response = await accountService.getActivityLogs(filters);
      setLogs(response.data.data.logs);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử hoạt động:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      action: "",
      startDate: "",
      endDate: "",
    });
  };

  const getEventType = (event) => {
    if (event.includes("login")) return "success";
    if (
      event.includes("error") ||
      event.includes("violation") ||
      event.includes("failed")
    )
      return "danger";
    if (event.includes("warning")) return "warning";
    if (event.includes("view") || event.includes("read")) return "info";
    if (event.includes("create") || event.includes("add")) return "primary";
    if (event.includes("update") || event.includes("edit")) return "warning";
    if (event.includes("delete") || event.includes("remove")) return "danger";
    return "secondary";
  };

  const getEventIcon = (event) => {
    if (event.includes("login")) return "fas fa-sign-in-alt";
    if (event.includes("logout")) return "fas fa-sign-out-alt";
    if (event.includes("update")) return "fas fa-edit";
    if (event.includes("create")) return "fas fa-plus-circle";
    if (event.includes("delete")) return "fas fa-trash-alt";
    if (event.includes("password")) return "fas fa-key";
    if (event.includes("friend")) return "fas fa-user-friends";
    if (event.includes("view") || event.includes("read")) return "fas fa-eye";
    if (event.includes("profile")) return "fas fa-user-circle";
    if (event.includes("message")) return "fas fa-comments";
    if (event.includes("search")) return "fas fa-search";
    return "fas fa-history";
  };

  const getEventCategory = (event) => {
    if (event.includes("friend")) return "Bạn bè";
    if (
      event.includes("login") ||
      event.includes("logout") ||
      event.includes("auth")
    )
      return "Xác thực";
    if (event.includes("profile")) return "Hồ sơ";
    if (event.includes("message")) return "Tin nhắn";
    if (event.includes("post")) return "Bài viết";
    if (event.includes("search")) return "Tìm kiếm";
    if (event.includes("settings")) return "Cài đặt";
    return "Khác";
  };

  const formatEventName = (event) => {
    const eventMap = {
      "friend.requests.view": "Xem yêu cầu kết bạn",
      "friend.request.send": "Gửi yêu cầu kết bạn",
      "friend.request.accept": "Chấp nhận kết bạn",
      "friend.request.reject": "Từ chối kết bạn",
      "user.login": "Đăng nhập thành công",
      "user.logout": "Đăng xuất",
      "profile.update": "Cập nhật hồ sơ",
      "password.change": "Đổi mật khẩu",
      "message.send": "Gửi tin nhắn",
      "post.create": "Tạo bài viết mới",
      "post.view": "Xem bài viết",
    };

    return (
      eventMap[event] ||
      event
        .replace(/_/g, " ")
        .split(".")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const renderPayloadDetails = (payload, meta) => {
    if (!payload && !meta) return null;

    return (
      <div className="payload-details mt-3 p-3 bg-light rounded">
        {meta?.description && (
          <div className="mb-3">
            <strong className="text-primary">
              <i className="fas fa-info-circle me-2"></i>Mô tả:
            </strong>{" "}
            {meta.description}
          </div>
        )}

        {payload && Object.keys(payload).length > 0 && (
          <Accordion className="small-accordion">
            <Accordion.Item eventKey="payload">
              <Accordion.Header className="py-2">
                <small>
                  <i className="fas fa-database me-2"></i>
                  Dữ liệu chi tiết ({Object.keys(payload).length} trường)
                </small>
              </Accordion.Header>
              <Accordion.Body className="pt-2 pb-3">
                {Object.entries(payload).map(([key, value]) => (
                  <div key={key} className="d-flex mb-2 align-items-start">
                    <span
                      className="text-muted me-2"
                      style={{ minWidth: "130px" }}
                    >
                      <strong>{formatKeyName(key)}:</strong>
                    </span>
                    <span className="text-break">
                      {typeof value === "object" ? (
                        <code className="small bg-white p-1 rounded">
                          {JSON.stringify(value, null, 2)}
                        </code>
                      ) : (
                        <span className="fw-medium">{String(value)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
      </div>
    );
  };

  const formatKeyName = (key) => {
    const keyMap = {
      type: "Loại",
      count: "Số lượng",
      userId: "ID người dùng",
      targetId: "ID đối tượng",
      ip: "IP",
      userAgent: "Trình duyệt",
      correlationId: "ID tương quan",
      url: "URL",
      method: "Phương thức",
      statusCode: "Mã trạng thái",
      duration: "Thời gian (ms)",
    };
    return keyMap[key] || key;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Đang tải lịch sử hoạt động...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0 fw-bold text-dark">
            <i className="fas fa-chart-line text-primary me-2"></i>
            Lịch Sử Hoạt Động
          </h4>
          <Badge bg="primary" className="fs-6 px-3 py-2">
            {pagination.totalLogs.toLocaleString()} hoạt động
          </Badge>
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        {/* Bộ lọc */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-light border-0">
            <h6 className="mb-0 fw-semibold">
              <i className="fas fa-filter text-primary me-2"></i>
              Bộ lọc tìm kiếm
            </h6>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Label className="small fw-medium">Hành động</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập hành động..."
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-medium">Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-medium">Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-medium">Số bản ghi</Form.Label>
                <Form.Select
                  value={filters.limit}
                  onChange={(e) =>
                    handleFilterChange("limit", parseInt(e.target.value))
                  }
                  size="sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={clearFilters}
                  className="w-100 d-flex align-items-center justify-content-center"
                >
                  <i className="fas fa-times me-2"></i>
                  Xóa bộ lọc
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Danh sách hoạt động */}
        <div className="activity-list">
          {logs.length === 0 ? (
            <Alert variant="light" className="text-center border-dashed py-5">
              <i className="fas fa-search fa-2x text-muted mb-3"></i>
              <p className="mb-0 text-muted">
                Không tìm thấy hoạt động nào phù hợp với bộ lọc.
              </p>
            </Alert>
          ) : (
            logs.map((log, index) => (
              <Card
                key={log._id || index}
                className={`mb-3 border-start border-4 border-${getEventType(
                  log.event
                )} shadow-sm hover-shadow transition`}
              >
                <Card.Body className="p-4">
                  <div className="d-flex">
                    <div
                      className={`icon-circle bg-${getEventType(
                        log.event
                      )} text-white d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
                    >
                      <i className={`${getEventIcon(log.event)} fa-fw`}></i>
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1 fw-semibold text-dark">
                            {formatEventName(log.event)}
                          </h6>
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <Badge
                              bg={getEventType(log.event)}
                              className="small"
                            >
                              {getEventCategory(log.event)}
                            </Badge>
                            <span className="text-success small fw-medium">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                        </div>
                        <OverlayTrigger
                          placement="left"
                          overlay={
                            <Tooltip>
                              {new Date(log.timestamp).toLocaleString("vi-VN")}
                            </Tooltip>
                          }
                        >
                          <small className="text-muted">
                            <i className="fas fa-clock"></i>
                          </small>
                        </OverlayTrigger>
                      </div>

                      <div className="d-flex flex-wrap gap-3 text-muted small mt-2">
                        {log.ip && (
                          <span>
                            <i className="fas fa-globe me-1"></i>
                            {log.ip}
                          </span>
                        )}
                        {log.url && (
                          <span
                            className="text-truncate"
                            style={{ maxWidth: "200px" }}
                          >
                            <i className="fas fa-link me-1"></i>
                            {log.url}
                          </span>
                        )}
                      </div>

                      {renderPayloadDetails(log.payload, log.meta)}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </div>

        {/* Phân trang */}
        {pagination.total > 1 && (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4">
            <div className="text-muted small mb-2 mb-md-0">
              Hiển thị{" "}
              <strong>
                {(filters.page - 1) * filters.limit + 1} -{" "}
                {Math.min(filters.page * filters.limit, pagination.totalLogs)}
              </strong>{" "}
              trong <strong>{pagination.totalLogs.toLocaleString()}</strong> kết
              quả
            </div>

            <Pagination size="sm">
              <Pagination.Prev
                disabled={filters.page === 1}
                onClick={() => handlePageChange(filters.page - 1)}
              />
              {[...Array(Math.min(5, pagination.total))].map((_, i) => {
                let pageNum;
                if (pagination.total <= 5) {
                  pageNum = i + 1;
                } else if (filters.page <= 3) {
                  pageNum = i + 1;
                } else if (filters.page >= pagination.total - 2) {
                  pageNum = pagination.total - 4 + i;
                } else {
                  pageNum = filters.page - 2 + i;
                }
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === filters.page}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}
              {pagination.total > 5 && filters.page < pagination.total - 2 && (
                <>
                  <Pagination.Ellipsis disabled />
                  <Pagination.Item
                    onClick={() => handlePageChange(pagination.total)}
                  >
                    {pagination.total}
                  </Pagination.Item>
                </>
              )}
              <Pagination.Next
                disabled={filters.page === pagination.total}
                onClick={() => handlePageChange(filters.page + 1)}
              />
            </Pagination>
          </div>
        )}
      </Card.Body>

      {/* CSS tùy chỉnh */}
      <style jsx>{`
        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          font-size: 1.1rem;
        }
        .hover-shadow {
          transition: all 0.2s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        .border-dashed {
          border: 2px dashed #dee2e6 !important;
        }
        .small-accordion .accordion-button {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }
        .transition {
          transition: all 0.3s ease;
        }
        .text-break {
          word-break: break-word;
        }
      `}</style>
    </Card>
  );
};

export default ActivityTab;
