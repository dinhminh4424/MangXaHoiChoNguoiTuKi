// components/Group/GroupMembers.js
import React, { useState, useEffect } from "react";
import { Search, UserPlus, MoreVertical, Crown, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Alert, Spinner, Button, Form, Card, Badge } from "react-bootstrap";
import groupService from "../../services/groupService";
import "./GroupMembers.css";

const GroupMembers = ({ groupId, isAdmin, onMembersUpdate }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await groupService.getGroupMembers(groupId, {
        limit: 100,
      });

      if (response.success) {
        setMembers(response.members || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tải thành viên");
    } finally {
      setLoading(false);
    }
  };

  const handleManageMember = async (memberId, action) => {
    try {
      setActionLoading(memberId);

      const response = await groupService.manageMember(
        groupId,
        memberId,
        action
      );

      if (response.success) {
        await loadMembers();
        onMembersUpdate?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thực hiện thao tác");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteToModerator = async (memberId, action = "add") => {
    try {
      setActionLoading(memberId);

      const response = await groupService.manageModerator(
        groupId,
        memberId,
        action
      );

      if (response.success) {
        await loadMembers();
      }
    } catch (err) {
      setError(err.response?.message || "Lỗi khi thêm quản trị viên");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.userId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.userId.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "owner":
        return (
          <Badge bg="warning">
            <Crown size={12} className="me-1" /> Chủ nhóm
          </Badge>
        );
      case "moderator":
        return (
          <Badge bg="info">
            <Shield size={12} className="me-1" /> Quản trị
          </Badge>
        );
      default:
        return <Badge bg="secondary">Thành viên</Badge>;
    }
  };

  const getJoinDate = (joinedAt) => {
    return new Date(joinedAt).toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Đang tải thành viên...</span>
      </div>
    );
  }

  return (
    <div className="group-members">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Thành viên ({members.length})</h4>

          <div className="d-flex gap-2">
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Tìm thành viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "35px" }}
              />
              <Search
                size={18}
                className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
              />
            </div>

            <Form.Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="all">Tất cả</option>
              <option value="owner">Chủ nhóm</option>
              <option value="moderator">Quản trị viên</option>
              <option value="member">Thành viên</option>
            </Form.Select>
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="members-list">
            {filteredMembers.map((member) => (
              <div
                key={member._id}
                className="member-card d-flex justify-content-between align-items-center p-3 border-bottom"
              >
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={
                      member.userId.profile?.avatar ||
                      "/assets/images/default-avatar.png"
                    }
                    alt={member.userId.fullName}
                    className="rounded-circle"
                    width="50"
                    height="50"
                  />

                  <div>
                    <h6 className="mb-1">
                      {member.userId.fullName}
                      {member.userId._id === user?.userId && " (Bạn)"}
                    </h6>
                    <p className="text-muted small mb-1">
                      @{member.userId.username}
                    </p>
                    <div className="d-flex gap-2 align-items-center">
                      {getRoleBadge(member.role)}
                      <span className="text-muted small">
                        Tham gia: {getJoinDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin && member.userId._id !== user?.userId && (
                  <div className="d-flex gap-2">
                    {member.role === "member" && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() =>
                          handlePromoteToModerator(member.userId._id)
                        }
                        disabled={actionLoading === member.userId._id}
                      >
                        {actionLoading === member.userId._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Thêm QTV"
                        )}
                      </Button>
                    )}

                    {member.role === "moderator" && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() =>
                          handlePromoteToModerator(member.userId._id, "remove")
                        }
                        disabled={actionLoading === member.userId._id}
                      >
                        {actionLoading === member.userId._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Gỡ QTV"
                        )}
                      </Button>
                    )}

                    {member.status === "active" && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() =>
                          handleManageMember(member.userId._id, "ban")
                        }
                        disabled={actionLoading === member.userId._id}
                      >
                        {actionLoading === member.userId._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Cấm"
                        )}
                      </Button>
                    )}
                    {member.status === "banned" && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() =>
                          handleManageMember(member.userId._id, "unban")
                        }
                        disabled={actionLoading === member.userId._id}
                      >
                        {actionLoading === member.userId._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Gỡ Ban"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-5">
              <UserPlus size={48} className="text-muted mb-3" />
              <p className="text-muted">Không tìm thấy thành viên nào</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default GroupMembers;
