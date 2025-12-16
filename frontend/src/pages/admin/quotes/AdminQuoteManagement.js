import React, { useState, useEffect } from "react";
import {
  getAllQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  toggleQuoteStatus,
} from "../../../services/adminQuotes";
import "./AdminQuoteManagement.css";
import NotificationService from "../../../services/notificationService";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";

const AdminQuoteManagement = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    author: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Form state
  const [quoteForm, setQuoteForm] = useState({
    content: "",
    author: "",
    active: true,
  });

  useEffect(() => {
    fetchQuotes();
  }, [filters]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await getAllQuotes(filters);
      setQuotes(response.data.data.quotes);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error("Fetch quotes error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleShowModal = (quote = null) => {
    setSelectedQuote(quote);
    setModalMode(quote ? "edit" : "create");
    if (quote) {
      setQuoteForm({
        content: quote.content,
        author: quote.author,
        active: quote.active,
      });
    } else {
      setQuoteForm({
        content: "",
        author: "",
        active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedQuote(null);
  };

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuoteForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await createQuote(quoteForm);
        NotificationService.success("Đã tạo quote mới thành công");
      } else {
        await updateQuote(selectedQuote._id, quoteForm);
        NotificationService.success("Đã cập nhật quote thành công");
      }
      handleCloseModal();
      fetchQuotes();
    } catch (error) {
      NotificationService.error(
        error.response?.data?.message || "Đã xảy ra lỗi"
      );
    }
  };

  const handleDelete = async (quoteId, content) => {
    const check = await NotificationService.confirm({
      title: `Bạn có chắc muốn xóa quote: "${content.substring(0, 50)}..."?`,
      confirmText: "Chắc chắn xóa",
      cancelText: "Hủy",
    });

    if (check.isConfirmed) {
      try {
        await deleteQuote(quoteId);
        NotificationService.success("Đã xóa quote thành công");
        fetchQuotes();
      } catch (error) {
        NotificationService.error("Không thể xóa quote");
      }
    }
  };

  const handleToggleStatus = async (quoteId, currentStatus) => {
    try {
      await toggleQuoteStatus(quoteId);
      NotificationService.success(
        currentStatus ? "Đã tắt quote" : "Đã kích hoạt quote"
      );
      fetchQuotes();
    } catch (error) {
      NotificationService.error("Không thể thay đổi trạng thái");
    }
  };

  // Filter handlers
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      author: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="admin-quote-management">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Quản lý Quote</h1>
          <p className="text-muted mb-0">Quản lý các câu nói truyền cảm hứng</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="ri-add-line me-2"></i> Thêm Quote
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-3">
              <Form.Label>Tìm kiếm nội dung</Form.Label>
              <Form.Control
                type="text"
                placeholder="Tìm theo nội dung..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <Form.Label>Tác giả</Form.Label>
              <Form.Control
                type="text"
                placeholder="Tìm tác giả..."
                value={filters.author}
                onChange={(e) => handleFilterChange("author", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã tắt</option>
              </Form.Select>
            </div>
            <div className="col-md-2">
              <Form.Label>Từ ngày</Form.Label>
              <Form.Control
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <Form.Label>Đến ngày</Form.Label>
              <Form.Control
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={handleResetFilters}
                title="Reset bộ lọc"
              >
                <i className="ri-refresh-line"></i>
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Quotes Table */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nội dung</th>
                  <th>Tác giả</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th width="150">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote, index) => (
                  <tr key={quote._id}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ maxWidth: "400px" }}>
                        {quote.content.length > 100
                          ? `${quote.content.substring(0, 100)}...`
                          : quote.content}
                      </div>
                    </td>
                    <td>{quote.author}</td>
                    <td>
                      <span
                        className={`badge ${
                          quote.active ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {quote.active ? "Đang hoạt động" : "Đã tắt"}
                      </span>
                    </td>
                    <td>
                      {new Date(quote.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleShowModal(quote)}
                          title="Chỉnh sửa"
                        >
                          <i className="ri-edit-line"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(quote._id, quote.content)}
                          title="Xóa"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                        <Button
                          variant={
                            quote.active
                              ? "outline-secondary"
                              : "outline-success"
                          }
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(quote._id, quote.active)
                          }
                          title={quote.active ? "Tắt quote" : "Kích hoạt quote"}
                        >
                          <i
                            className={
                              quote.active ? "ri-eye-off-line" : "ri-eye-line"
                            }
                          ></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted">
            Hiển thị {quotes.length} trong tổng số {pagination.total} quotes
          </div>
          <Pagination>
            <Pagination.Prev
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            />
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <Pagination.Item
                  key={page}
                  active={filters.page === page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Pagination.Item>
              )
            )}
            <Pagination.Next
              disabled={filters.page === pagination.pages}
              onClick={() => handlePageChange(filters.page + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Quote Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "create" ? "Thêm Quote mới" : "Chỉnh sửa Quote"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nội dung *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="content"
                value={quoteForm.content}
                onChange={handleFormChange}
                required
                placeholder="Nhập nội dung quote..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tác giả</Form.Label>
              <Form.Control
                type="text"
                name="author"
                value={quoteForm.author}
                onChange={handleFormChange}
                placeholder="Nhập tên tác giả (để trống nếu là Khuyết Danh)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="active"
                label="Kích hoạt quote này"
                checked={quoteForm.active}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === "create" ? "Tạo Quote" : "Cập nhật"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminQuoteManagement;
