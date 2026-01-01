// components/profile/EmergencyContactsTab.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";

const EmergencyContactsTab = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "family",
    priority: "medium",
  });
  const [editingContact, setEditingContact] = useState(null);
  const [emergencyMessage, setEmergencyMessage] = useState("");

  useEffect(() => {
    fetchEmergencyContacts();
    fetchStats();
  }, [userId]);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${userId}/emergency-contacts`);
      setContacts(response.data.data);
    } catch (error) {
      console.error("Lỗi khi tải liên hệ khẩn cấp:", error);
      alert("Không thể tải danh sách liên hệ khẩn cấp");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(
        `/api/users/${userId}/emergency-contacts/stats`
      );
      setStats(response.data.data);
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/api/users/${userId}/emergency-contacts`,
        newContact
      );
      setContacts([...contacts, response.data.data]);
      setNewContact({
        name: "",
        email: "",
        phone: "",
        relationship: "family",
        priority: "medium",
      });
      fetchStats();
      alert("Thêm liên hệ khẩn cấp thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm liên hệ:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi thêm liên hệ");
    }
  };

  const handleUpdateContact = async (contactId) => {
    try {
      const response = await api.put(
        `/api/users/${userId}/emergency-contacts/${contactId}`,
        editingContact
      );

      setContacts(
        contacts.map((contact) =>
          contact._id === contactId ? response.data.data : contact
        )
      );

      setEditingContact(null);
      fetchStats();
      alert("Cập nhật liên hệ thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật liên hệ:", error);
      alert(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật liên hệ"
      );
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) {
      try {
        await api.delete(
          `/api/users/${userId}/emergency-contacts/${contactId}`
        );
        setContacts(contacts.filter((contact) => contact._id !== contactId));
        fetchStats();
        alert("Xóa liên hệ thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa liên hệ:", error);
        alert("Có lỗi xảy ra khi xóa liên hệ");
      }
    }
  };

  const handleEmergencyNotify = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn gửi thông báo khẩn cấp đến tất cả liên hệ?"
      )
    ) {
      return;
    }

    if (!emergencyMessage.trim()) {
      alert("Vui lòng nhập nội dung thông báo khẩn cấp");
      return;
    }

    try {
      const response = await api.post(
        `/api/users/${userId}/emergency-contacts/notify`,
        {
          message: emergencyMessage,
          emergencyType: "urgent_help",
          location: "Vị trí hiện tại",
        }
      );

      alert("Đã gửi thông báo khẩn cấp đến các liên hệ!");
      setEmergencyMessage("");
      fetchStats();
    } catch (error) {
      console.error("Lỗi khi gửi thông báo khẩn cấp:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi gửi thông báo");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-contacts-tab">
      {/* Thông báo khẩn cấp */}
      {/* <div className="card mb-4 border-danger">
        <div className="card-header bg-danger text-white">
          <h5 className="mb-0">🚨 Gửi thông báo khẩn cấp</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Thông điệp khẩn cấp *</label>
            <textarea
              className="form-control"
              rows="3"
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              placeholder="Nhập thông điệp cần gửi đến các liên hệ..."
              required
            />
          </div>
          <button
            className="btn btn-danger"
            onClick={handleEmergencyNotify}
            disabled={contacts.length === 0 || !emergencyMessage.trim()}
          >
            🚨 Gửi thông báo khẩn cấp ngay
          </button>
          <p className="small text-muted mt-2">
            Thông báo sẽ được gửi đến tất cả liên hệ khẩn cấp của bạn
          </p>
        </div>
      </div> */}

      {/* Thống kê */}
      {stats && (
        <div className="row mb-4 d-flex align-items-stretch">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">
                  <svg
                    width="30"
                    height="30"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                  >
                    <g fill="none">
                      <path
                        fill="#8fbffa"
                        d="M24 1.531c-7.401 0-12.593.278-15.864.544c-3.288.267-5.825 2.804-6.092 6.092C1.778 11.439 1.5 16.63 1.5 24.03s.278 12.593.544 15.865c.267 3.287 2.804 5.824 6.092 6.091c3.271.266 8.463.544 15.864.544s12.593-.278 15.864-.544c3.288-.267 5.825-2.804 6.092-6.092c.266-3.271.544-8.462.544-15.864c0-7.401-.278-12.592-.544-15.864c-.267-3.288-2.804-5.825-6.092-6.092C36.593 1.808 31.402 1.53 24 1.53"
                      />
                      <path
                        fill="#2859c5"
                        fillRule="evenodd"
                        d="M26.686 36.176a3.72 3.72 0 0 0 4.973-.524c3.776-4.244 6.2-8.03 7.411-10.118c.635-1.093.804-2.448-.143-3.285a6 6 0 0 0-.824-.61c-1.224-.755-2.593-.004-3.51 1.103c-1.503 1.816-3.897 4.667-5.618 6.52a.95.95 0 0 1-1.274.116c-1.53-1.151-3.436-2.79-4.958-4.138c-1.522-1.349-3.815-1.4-5.274.018c-2.497 2.427-5.075 5.272-7.224 7.789c-1.368 1.6-1.53 3.94.047 5.335a13 13 0 0 0 1.323 1.021c1.857 1.24 4.17.264 5.344-1.636c1.007-1.63 2.259-3.585 3.385-5.137a.98.98 0 0 1 1.402-.185c1.039.812 2.96 2.296 4.94 3.73"
                        clipRule="evenodd"
                      />
                      <path
                        fill="#2859c5"
                        d="M11 17a2 2 0 1 0 0 4h6a2 2 0 1 0 0-4zm-2-6a2 2 0 0 1 2-2h10a2 2 0 1 1 0 4H11a2 2 0 0 1-2-2"
                      />
                    </g>
                  </svg>
                  {"  "}
                  Thống kê liên hệ
                </h6>
                <div className="d-flex justify-content-between">
                  <span>Tổng số liên hệ:</span>
                  <strong>{stats.totalContacts}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Đã thông báo gần đây:</span>
                  <strong>{stats.recentlyNotified}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">
                  <svg
                    width="30"
                    height="30"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                  >
                    <g fill="none">
                      <path
                        fill="#8fbffa"
                        d="M24 1.531c-7.401 0-12.593.278-15.864.544c-3.288.267-5.825 2.804-6.092 6.092C1.778 11.439 1.5 16.63 1.5 24.03s.278 12.593.544 15.865c.267 3.287 2.804 5.824 6.092 6.091c3.271.266 8.463.544 15.864.544s12.593-.278 15.864-.544c3.288-.267 5.825-2.804 6.092-6.092c.266-3.271.544-8.462.544-15.864c0-7.401-.278-12.592-.544-15.864c-.267-3.288-2.804-5.825-6.092-6.092C36.593 1.808 31.402 1.53 24 1.53"
                      />
                      <path
                        fill="#2859c5"
                        fillRule="evenodd"
                        d="M26.686 36.176a3.72 3.72 0 0 0 4.973-.524c3.776-4.244 6.2-8.03 7.411-10.118c.635-1.093.804-2.448-.143-3.285a6 6 0 0 0-.824-.61c-1.224-.755-2.593-.004-3.51 1.103c-1.503 1.816-3.897 4.667-5.618 6.52a.95.95 0 0 1-1.274.116c-1.53-1.151-3.436-2.79-4.958-4.138c-1.522-1.349-3.815-1.4-5.274.018c-2.497 2.427-5.075 5.272-7.224 7.789c-1.368 1.6-1.53 3.94.047 5.335a13 13 0 0 0 1.323 1.021c1.857 1.24 4.17.264 5.344-1.636c1.007-1.63 2.259-3.585 3.385-5.137a.98.98 0 0 1 1.402-.185c1.039.812 2.96 2.296 4.94 3.73"
                        clipRule="evenodd"
                      />
                      <path
                        fill="#2859c5"
                        d="M11 17a2 2 0 1 0 0 4h6a2 2 0 1 0 0-4zm-2-6a2 2 0 0 1 2-2h10a2 2 0 1 1 0 4H11a2 2 0 0 1-2-2"
                      />
                    </g>
                  </svg>
                  {"  "}
                  Mức độ ưu tiên
                </h6>
                <div className="d-flex justify-content-between">
                  <span className="text-danger">Cao:</span>
                  <strong>{stats.priorityDistribution.high || 0}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-warning">Trung bình:</span>
                  <strong>{stats.priorityDistribution.medium || 0}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-success">Thấp:</span>
                  <strong>{stats.priorityDistribution.low || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách liên hệ */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <svg
              width="30"
              height="30"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
            >
              <g fill="none">
                <path
                  fill="#8fbffa"
                  d="M24 1.5c-4.522 0-7.901.202-10.266.429c-3.295.315-5.655 2.963-5.843 6.177a192 192 0 0 0-.108 2.07l5.058 4.215a6 6 0 0 1 0 9.219l-.468.39l.468.39a6 6 0 0 1 0 9.22l-5.058 4.215q.054 1.14.108 2.07c.188 3.213 2.548 5.861 5.843 6.176c2.365.227 5.744.429 10.266.429s7.902-.203 10.267-.429c3.294-.315 5.654-2.963 5.842-6.177q.055-.928.108-2.07L35.16 33.61a6 6 0 0 1 0-9.218l.469-.39l-.469-.392a6 6 0 0 1 0-9.218l5.058-4.215q-.053-1.142-.108-2.07c-.188-3.214-2.547-5.862-5.842-6.177C31.902 1.702 28.522 1.5 24 1.5"
                />
                <path
                  fill="#2859c5"
                  d="m18.328 1.617l.345 2.755A3 3 0 0 0 21.648 7h4.704a3 3 0 0 0 2.976-2.628l.345-2.755A130 130 0 0 0 24 1.5c-2.143 0-4.03.045-5.673.117Z"
                />
                <path
                  fill="#2859c5"
                  fillRule="evenodd"
                  d="M20.5 41a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 0 3h-4a1.5 1.5 0 0 1-1.5-1.5m26.036-28.28a2 2 0 0 1-.256 2.816L42.124 19l4.156 3.464a2 2 0 0 1 0 3.073L42.124 29l4.156 3.464a2 2 0 0 1-2.56 3.072l-6-5a2 2 0 0 1 0-3.072L41.876 24l-4.156-3.463a2 2 0 0 1 0-3.073l6-5a2 2 0 0 1 2.816.256m-45.072 0a2 2 0 0 0 .256 2.816L5.876 19L1.72 22.464a2 2 0 0 0 0 3.073L5.876 29L1.72 32.464a2 2 0 0 0 2.56 3.072l6-5a2 2 0 0 0 0-3.072L6.124 24l4.156-3.463a2 2 0 0 0 0-3.073l-6-5a2 2 0 0 0-2.816.256"
                  clipRule="evenodd"
                />
              </g>
            </svg>{" "}
            Quản lý liên hệ khẩn cấp
          </h5>
          <p className="mb-0 small">
            Thông tin này sẽ được sử dụng trong trường hợp khẩn cấp
          </p>
        </div>

        <div className="card-body">
          {/* Form thêm/chỉnh sửa liên hệ */}
          <div className="mb-4">
            <h6>
              {editingContact
                ? "Chỉnh sửa liên hệ"
                : "Thêm liên hệ khẩn cấp mới"}
            </h6>
            <form
              onSubmit={
                editingContact
                  ? (e) => {
                      e.preventDefault();
                      handleUpdateContact(editingContact._id);
                    }
                  : handleAddContact
              }
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Họ và tên *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={
                      editingContact ? editingContact.name : newContact.name
                    }
                    onChange={(e) =>
                      editingContact
                        ? setEditingContact({
                            ...editingContact,
                            name: e.target.value,
                          })
                        : setNewContact({ ...newContact, name: e.target.value })
                    }
                    required
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={
                      editingContact ? editingContact.phone : newContact.phone
                    }
                    onChange={(e) =>
                      editingContact
                        ? setEditingContact({
                            ...editingContact,
                            phone: e.target.value,
                          })
                        : setNewContact({
                            ...newContact,
                            phone: e.target.value,
                          })
                    }
                    required
                    placeholder="0912345678"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={
                      editingContact ? editingContact.email : newContact.email
                    }
                    onChange={(e) =>
                      editingContact
                        ? setEditingContact({
                            ...editingContact,
                            email: e.target.value,
                          })
                        : setNewContact({
                            ...newContact,
                            email: e.target.value,
                          })
                    }
                    placeholder="example@email.com"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mối quan hệ *</label>
                  <select
                    className="form-select"
                    value={
                      editingContact
                        ? editingContact.relationship
                        : newContact.relationship
                    }
                    onChange={(e) =>
                      editingContact
                        ? setEditingContact({
                            ...editingContact,
                            relationship: e.target.value,
                          })
                        : setNewContact({
                            ...newContact,
                            relationship: e.target.value,
                          })
                    }
                    required
                  >
                    <option value="family">Gia đình</option>
                    <option value="friend">Bạn bè</option>
                    <option value="spouse">Vợ/Chồng</option>
                    <option value="parent">Cha/Mẹ</option>
                    <option value="sibling">Anh/Chị/Em ruột</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mức độ ưu tiên</label>
                  <select
                    className="form-select"
                    value={
                      editingContact
                        ? editingContact.priority
                        : newContact.priority
                    }
                    onChange={(e) =>
                      editingContact
                        ? setEditingContact({
                            ...editingContact,
                            priority: e.target.value,
                          })
                        : setNewContact({
                            ...newContact,
                            priority: e.target.value,
                          })
                    }
                  >
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingContact ? "Cập nhật" : "Thêm liên hệ"}
                    </button>
                    {editingContact && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingContact(null)}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Danh sách liên hệ */}
          <div>
            <h6>Danh sách liên hệ khẩn cấp ({contacts.length}/5)</h6>
            {contacts.length === 0 ? (
              <div className="alert alert-info">
                Chưa có liên hệ khẩn cấp nào. Hãy thêm ít nhất một liên hệ.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Họ tên</th>
                      <th>Thông tin liên hệ</th>
                      <th>Mối quan hệ</th>
                      <th>Mức độ ưu tiên</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact, index) => (
                      <tr key={contact._id || contact.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{contact.name}</strong>
                          {contact.lastNotified && (
                            <div className="small text-muted">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 16 16"
                              >
                                <g fill="none">
                                  <path
                                    fill="url(#fluentColorCalendarClock160)"
                                    d="M14 11.5v-6l-6-1l-6 1v6A2.5 2.5 0 0 0 4.5 14h7a2.5 2.5 0 0 0 2.5-2.5"
                                  />
                                  <path
                                    fill="url(#fluentColorCalendarClock161)"
                                    d="M14 11.5v-6l-6-1l-6 1v6A2.5 2.5 0 0 0 4.5 14h7a2.5 2.5 0 0 0 2.5-2.5"
                                  />
                                  <path
                                    fill="url(#fluentColorCalendarClock165)"
                                    fillOpacity=".3"
                                    d="M14 11.5v-6l-6-1l-6 1v6A2.5 2.5 0 0 0 4.5 14h7a2.5 2.5 0 0 0 2.5-2.5"
                                  />
                                  <path
                                    fill="url(#fluentColorCalendarClock162)"
                                    d="M14 4.5A2.5 2.5 0 0 0 11.5 2h-7A2.5 2.5 0 0 0 2 4.5V6h12z"
                                  />
                                  <path
                                    fill="url(#fluentColorCalendarClock163)"
                                    d="M16 11.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0"
                                  />
                                  <path
                                    fill="url(#fluentColorCalendarClock164)"
                                    fillRule="evenodd"
                                    d="M11.5 9a.5.5 0 0 1 .5.5V11h1a.5.5 0 0 1 0 1h-1.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5"
                                    clipRule="evenodd"
                                  />
                                  <defs>
                                    <linearGradient
                                      id="fluentColorCalendarClock160"
                                      x1="6.286"
                                      x2="9.327"
                                      y1="4.5"
                                      y2="13.987"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#B3E0FF" />
                                      <stop offset="1" stopColor="#8CD0FF" />
                                    </linearGradient>
                                    <linearGradient
                                      id="fluentColorCalendarClock161"
                                      x1="9.286"
                                      x2="11.025"
                                      y1="8.386"
                                      y2="16.154"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop
                                        stopColor="#DCF8FF"
                                        stopOpacity="0"
                                      />
                                      <stop
                                        offset="1"
                                        stopColor="#FF6CE8"
                                        stopOpacity=".7"
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="fluentColorCalendarClock162"
                                      x1="2.482"
                                      x2="4.026"
                                      y1="2"
                                      y2="8.725"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#0094F0" />
                                      <stop offset="1" stopColor="#2764E7" />
                                    </linearGradient>
                                    <linearGradient
                                      id="fluentColorCalendarClock163"
                                      x1="8.5"
                                      x2="13"
                                      y1="6.5"
                                      y2="16.5"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#1EC8B0" />
                                      <stop offset="1" stopColor="#2764E7" />
                                    </linearGradient>
                                    <linearGradient
                                      id="fluentColorCalendarClock164"
                                      x1="11.219"
                                      x2="10.509"
                                      y1="9.459"
                                      y2="11.892"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#FDFDFD" />
                                      <stop offset="1" stopColor="#D1D1FF" />
                                    </linearGradient>
                                    <radialGradient
                                      id="fluentColorCalendarClock165"
                                      cx="0"
                                      cy="0"
                                      r="1"
                                      gradientTransform="matrix(.14285 6.79546 -6.61306 .13902 11.857 12.704)"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop offset=".497" stopColor="#4A43CB" />
                                      <stop
                                        offset="1"
                                        stopColor="#4A43CB"
                                        stopOpacity="0"
                                      />
                                    </radialGradient>
                                  </defs>
                                </g>
                              </svg>
                              {"  "}
                              Đã thông báo:{" "}
                              {new Date(
                                contact.lastNotified
                              ).toLocaleDateString("vi-VN")}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>
                            {contact.phone && (
                              <div>
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-decoration-none"
                                >
                                  <svg
                                    width="20"
                                    height="20"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 14 14"
                                  >
                                    <g
                                      fill="none"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    >
                                      <path
                                        fill="#8fbffa"
                                        d="M6.177 2.796a31 31 0 0 0-3.618.059c-.959.07-1.702.853-1.784 1.81C.678 5.803.582 6.978.582 8.18s.096 2.377.193 3.513c.082.958.825 1.74 1.784 1.811c1.576.116 3.066.116 4.642 0c.958-.07 1.701-.853 1.784-1.81c.095-1.11.188-2.255.193-3.427a2 2 0 0 1-1.112-1.066H7A1.75 1.75 0 0 1 5.657 4.33l.048-.057c.302-.361.467-.816.467-1.287q0-.094.005-.19"
                                      />
                                      <path
                                        fill="#2859c5"
                                        d="M3.514 11.02a.75.75 0 0 1 .75-.75h1.232a.75.75 0 0 1 0 1.5H4.264a.75.75 0 0 1-.75-.75m4.663-9.858a2.578 2.578 0 0 1 4.401 1.823c0 .763.268 1.502.757 2.088l.049.058a.5.5 0 0 1-.384.82h-2.35v.45a.75.75 0 0 1-1.5 0v-.45H7a.5.5 0 0 1-.384-.82l.049-.058a3.26 3.26 0 0 0 .757-2.088c0-.683.272-1.34.755-1.823"
                                      />
                                    </g>
                                  </svg>{" "}
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.email && (
                              <div>
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-decoration-none"
                                >
                                  <svg
                                    width="20"
                                    height="20"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 32 32"
                                  >
                                    <g fill="none">
                                      <path
                                        fill="#367AF2"
                                        d="m30 10l-13.526 7.292a1 1 0 0 1-.948 0L2 10v12.5A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5z"
                                      />
                                      <path
                                        fill="url(#SVGdSJmMdbi)"
                                        d="m30 10l-13.526 7.292a1 1 0 0 1-.948 0L2 10v12.5A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5z"
                                      />
                                      <path
                                        fill="url(#SVGQkZJFdVd)"
                                        d="m30 10l-13.526 7.292a1 1 0 0 1-.948 0L2 10v12.5A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5z"
                                      />
                                      <path
                                        fill="url(#SVG2fqZDdMW)"
                                        fillOpacity=".75"
                                        d="m30 10l-13.526 7.292a1 1 0 0 1-.948 0L2 10v12.5A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5z"
                                      />
                                      <path
                                        fill="url(#SVGGUTSocrT)"
                                        fillOpacity=".7"
                                        d="m30 10l-13.526 7.292a1 1 0 0 1-.948 0L2 10v12.5A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5z"
                                      />
                                      <path
                                        fill="url(#SVGAMI8ddVY)"
                                        d="M2 9.5A4.5 4.5 0 0 1 6.5 5h19c1.414 0 2.675.652 3.5 1.671V10h1v.59l-13.526 7.292a1 1 0 0 1-.948 0L2 10.59z"
                                      />
                                      <path
                                        fill="url(#SVGYEok04vv)"
                                        fillOpacity=".3"
                                        d="M6.5 5A4.5 4.5 0 0 0 2 9.5v13A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5V10h-1V6.671A4.5 4.5 0 0 0 25.5 5z"
                                      />
                                      <path
                                        fill="url(#SVGESQDbbbc)"
                                        fillOpacity=".3"
                                        d="M6.5 5A4.5 4.5 0 0 0 2 9.5v13A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5V10h-1V6.671A4.5 4.5 0 0 0 25.5 5z"
                                      />
                                      <path
                                        fill="url(#SVGNwb6JdwR)"
                                        fillOpacity=".3"
                                        d="M6.5 5A4.5 4.5 0 0 0 2 9.5v13A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5V10h-1V6.671A4.5 4.5 0 0 0 25.5 5z"
                                      />
                                      <path
                                        fill="url(#SVGmUrvGeGD)"
                                        fillOpacity=".3"
                                        d="M6.5 5A4.5 4.5 0 0 0 2 9.5v13A4.5 4.5 0 0 0 6.5 27h19a4.5 4.5 0 0 0 4.5-4.5V10h-1V6.671A4.5 4.5 0 0 0 25.5 5z"
                                      />
                                      <circle
                                        cx="24.5"
                                        cy="13"
                                        r="3"
                                        fill="url(#SVGypeAOe9k)"
                                      />
                                      <path
                                        fill="url(#SVGnYrfbc8I)"
                                        d="M19.729 5A5 5 0 0 1 29.5 6.5v2.657l2.308 2.596A.75.75 0 0 1 31.299 13h-13.6a.75.75 0 0 1-.508-1.247L19.5 9.156V6.5c0-.523.08-1.026.229-1.5"
                                      />
                                      <defs>
                                        <linearGradient
                                          id="SVGdSJmMdbi"
                                          x1="19.555"
                                          x2="26.862"
                                          y1="13.332"
                                          y2="27.873"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            offset=".199"
                                            stopColor="#0094F0"
                                            stopOpacity="0"
                                          />
                                          <stop
                                            offset=".431"
                                            stopColor="#0094F0"
                                          />
                                        </linearGradient>
                                        <linearGradient
                                          id="SVGQkZJFdVd"
                                          x1="12"
                                          x2="4.914"
                                          y1="11.79"
                                          y2="28.328"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            offset=".191"
                                            stopColor="#0094F0"
                                            stopOpacity="0"
                                          />
                                          <stop
                                            offset=".431"
                                            stopColor="#0094F0"
                                          />
                                        </linearGradient>
                                        <linearGradient
                                          id="SVG2fqZDdMW"
                                          x1="23.383"
                                          x2="24.532"
                                          y1="20.142"
                                          y2="28.575"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            stopColor="#2764E7"
                                            stopOpacity="0"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#2764E7"
                                          />
                                        </linearGradient>
                                        <linearGradient
                                          id="SVGGUTSocrT"
                                          x1="20.333"
                                          x2="22.43"
                                          y1="12.088"
                                          y2="29.25"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            offset=".533"
                                            stopColor="#FF6CE8"
                                            stopOpacity="0"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#FF6CE8"
                                          />
                                        </linearGradient>
                                        <linearGradient
                                          id="SVGAMI8ddVY"
                                          x1="10.318"
                                          x2="18.903"
                                          y1=".976"
                                          y2="23.436"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop stopColor="#6CE0FF" />
                                          <stop
                                            offset=".462"
                                            stopColor="#29C3FF"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#4894FE"
                                          />
                                        </linearGradient>
                                        <linearGradient
                                          id="SVGypeAOe9k"
                                          x1="24.519"
                                          x2="24.519"
                                          y1="12.499"
                                          y2="15.999"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop stopColor="#EB4824" />
                                          <stop
                                            offset="1"
                                            stopColor="#FFCD0F"
                                            stopOpacity=".988"
                                          />
                                        </linearGradient>
                                        <linearGradient
                                          id="SVGnYrfbc8I"
                                          x1="32.02"
                                          x2="20.9"
                                          y1="12.995"
                                          y2="1.131"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop stopColor="#FF6F47" />
                                          <stop
                                            offset="1"
                                            stopColor="#FFCD0F"
                                          />
                                        </linearGradient>
                                        <radialGradient
                                          id="SVGYEok04vv"
                                          cx="0"
                                          cy="0"
                                          r="1"
                                          gradientTransform="matrix(0 5 -5.06764 0 24.5 13)"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            offset=".535"
                                            stopColor="#4A43CB"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#4A43CB"
                                            stopOpacity="0"
                                          />
                                        </radialGradient>
                                        <radialGradient
                                          id="SVGESQDbbbc"
                                          cx="0"
                                          cy="0"
                                          r="1"
                                          gradientTransform="matrix(0 2 -9.1875 0 24.5 12.5)"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            offset=".535"
                                            stopColor="#4A43CB"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#4A43CB"
                                            stopOpacity="0"
                                          />
                                        </radialGradient>
                                        <radialGradient
                                          id="SVGNwb6JdwR"
                                          cx="0"
                                          cy="0"
                                          r="1"
                                          gradientTransform="matrix(1 1.5 -1.875 1.25 19 11)"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop stopColor="#4A43CB" />
                                          <stop
                                            offset="1"
                                            stopColor="#4A43CB"
                                            stopOpacity="0"
                                          />
                                        </radialGradient>
                                        <radialGradient
                                          id="SVGmUrvGeGD"
                                          cx="0"
                                          cy="0"
                                          r="1"
                                          gradientTransform="rotate(90.406 9.271 15.163)scale(8.5 6.24951)"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop
                                            offset=".604"
                                            stopColor="#4A43CB"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#4A43CB"
                                            stopOpacity="0"
                                          />
                                        </radialGradient>
                                      </defs>
                                    </g>
                                  </svg>{" "}
                                  {contact.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              contact.relationship === "family"
                                ? "bg-primary"
                                : contact.relationship === "friend"
                                ? "bg-info"
                                : contact.relationship === "spouse"
                                ? "bg-success"
                                : contact.relationship === "parent"
                                ? "bg-warning"
                                : "bg-secondary"
                            }`}
                          >
                            {contact.relationship === "family"
                              ? "Gia đình"
                              : contact.relationship === "friend"
                              ? "Bạn bè"
                              : contact.relationship === "spouse"
                              ? "Vợ/Chồng"
                              : contact.relationship === "parent"
                              ? "Cha/Mẹ"
                              : contact.relationship === "sibling"
                              ? "Anh/Chị/Em"
                              : "Khác"}
                          </span>
                        </td>
                        <td>
                          {contact.priority === "high" && (
                            <span className="badge bg-danger">Cao</span>
                          )}
                          {contact.priority === "medium" && (
                            <span className="badge bg-warning">Trung bình</span>
                          )}
                          {contact.priority === "low" && (
                            <span className="badge bg-success">Thấp</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => setEditingContact(contact)}
                            >
                              Sửa
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() =>
                                handleDeleteContact(contact._id || contact.id)
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lưu ý quan trọng */}
          <div className="alert alert-warning mt-4">
            <strong>⚠️ Lưu ý quan trọng:</strong>
            <ul className="mb-0 mt-2">
              <li>
                Thông tin liên hệ khẩn cấp chỉ được sử dụng trong trường hợp
                thực sự cần thiết
              </li>
              <li>
                Đảm bảo số điện thoại luôn chính xác và có thể liên lạc được
              </li>
              <li>Nên có ít nhất 2-3 liên hệ khẩn cấp</li>
              <li>
                Thông báo cho người thân về việc bạn đặt họ làm liên hệ khẩn cấp
              </li>
              <li>
                Nút "Gửi thông báo khẩn cấp" chỉ sử dụng trong tình huống thực
                sự khẩn cấp
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactsTab;
