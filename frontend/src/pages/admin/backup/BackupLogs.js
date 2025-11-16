// src/pages/admin/backup/BackupLogs.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Form,
  Spinner,
  ButtonGroup,
  Button,
} from "react-bootstrap";
import { backupService } from "../../../services/adminService";
import { formatDate } from "../../../utils/helpers";

const BackupLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await backupService.getBackupLogs(filters);
      if (response.success) {
        setLogs(response.logs);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: "success",
      failed: "danger",
      in_progress: "warning",
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const getActionBadge = (action) => {
    const variants = {
      backup: "primary",
      restore: "warning",
      download: "info",
      delete: "danger",
    };
    return <Badge bg={variants[action]}>{action}</Badge>;
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h2 className="mb-4">Lịch sử Backup & Restore</h2>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Lọc theo hành động</Form.Label>
            <Form.Select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="backup">Backup</option>
              <option value="restore">Restore</option>
              <option value="download">Download</option>
              <option value="delete">Delete</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Số bản ghi</Form.Label>
            <Form.Select
              value={filters.limit}
              onChange={(e) =>
                handleFilterChange("limit", parseInt(e.target.value))
              }
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Logs Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Nhật ký hoạt động</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Loại</th>
                        <th>Hành động</th>
                        <th>Trạng thái</th>
                        <th>Người thực hiện</th>
                        <th>Thời gian</th>
                        <th>Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.fileName}</td>
                          <td>{getActionBadge(log.type)}</td>
                          <td>{getActionBadge(log.action)}</td>
                          <td>{getStatusBadge(log.status)}</td>
                          <td>{log.performedBy?.username || "N/A"}</td>
                          <td>{formatDate(log.createdAt)}</td>
                          <td>
                            {log.errorMessage && (
                              <small className="text-danger">
                                {log.errorMessage}
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-muted py-3"
                          >
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="d-flex justify-content-between align-items-center">
                      <small>
                        Hiển thị {logs.length} của {pagination.total} bản ghi
                      </small>
                      <ButtonGroup>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={filters.page === 1}
                          onClick={() =>
                            handleFilterChange("page", filters.page - 1)
                          }
                        >
                          Previous
                        </Button>
                        <Button variant="outline-primary" size="sm" disabled>
                          {filters.page} / {pagination.pages}
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={filters.page === pagination.pages}
                          onClick={() =>
                            handleFilterChange("page", filters.page + 1)
                          }
                        >
                          Next
                        </Button>
                      </ButtonGroup>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BackupLogs;
