// components/Group/GroupSidebar.js
import React from "react";
import {
  Home,
  Users,
  Settings,
  Calendar,
  Images,
  FileText,
  Bell,
} from "lucide-react";
import { ListGroup, Card, Badge } from "react-bootstrap";
import "./GroupSidebar.css";

const GroupSidebar = ({ group, activeTab, onTabChange, isMember, isAdmin }) => {
  const menuItems = [
    {
      id: "feed",
      label: "Bài viết",
      icon: <Home size={18} />,
      visible: true,
    },
    {
      id: "members",
      label: "Thành viên",
      icon: <Users size={18} />,
      visible: true,
    },
    // {
    //   id: "events",
    //   label: "Sự kiện",
    //   icon: <Calendar size={18} />,
    //   visible: isMember,
    // },
    {
      id: "images",
      label: "Ảnh & Video",
      icon: <Images size={18} />,
      visible: isMember,
    },
    {
      id: "files",
      label: "Tệp",
      icon: <FileText size={18} />,
      visible: isMember,
    },
    {
      id: "settings",
      label: "Quản lý nhóm",
      icon: <Settings size={18} />,
      visible: isAdmin,
    },
  ];

  const visibleItems = menuItems.filter((item) => item.visible);

  return (
    <div className="group-sidebar">
      {/* Menu Navigation */}
      <Card className="mb-3 bg-primary">
        <Card.Body className="p-0">
          <ListGroup variant="flush">
            {visibleItems.map((item) => (
              <ListGroup.Item
                key={item.id}
                action
                active={activeTab === item.id}
                onClick={() => onTabChange(item.id)}
                className="d-flex align-items-center gap-3 border-0"
              >
                {item.icon}
                <span>{item.label}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Group Info */}
      <Card className="mb-3">
        <Card.Header className="bg-primary">
          <h6 className="mb-0">Giới thiệu</h6>
        </Card.Header>
        <Card.Body>
          <p className="small text-muted">{group.description}</p>

          <div className="mb-2">
            <small className="text-muted">Loại nhóm:</small>
            <div>
              <Badge bg="light" text="dark">
                {group.visibility === "public"
                  ? "Công khai"
                  : group.visibility === "private"
                  ? "Riêng tư"
                  : "Chỉ theo lời mời"}
              </Badge>
            </div>
          </div>

          <div className="mb-2">
            <small className="text-muted">Ngày tạo:</small>
            <div>
              <small>
                {new Date(group.createdAt).toLocaleDateString("vi-VN")}
              </small>
            </div>
          </div>

          {group.tags && group.tags.length > 0 && (
            <div className="mb-2">
              <small className="text-muted">Tags:</small>
              <div>
                {group.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    bg="outline-secondary"
                    className="me-1 mb-1"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {group.emotionTags && group.emotionTags.length > 0 && (
            <div>
              <small className="text-muted">Cảm xúc:</small>
              <div>
                {group.emotionTags.map((emotion, index) => (
                  <Badge
                    key={index}
                    bg="outline-primary"
                    className="me-1 mb-1"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Admin Tools */}
      {/* {isAdmin && (
        <Card>
          <Card.Header>
            <h6 className="mb-0">Công cụ quản trị</h6>
          </Card.Header>
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              <ListGroup.Item
                action
                className="d-flex align-items-center gap-3 border-0"
              >
                <Bell size={16} />
                <span>Thông báo nhóm</span>
              </ListGroup.Item>
              <ListGroup.Item
                action
                className="d-flex align-items-center gap-3 border-0"
              >
                <Users size={16} />
                <span>Duyệt thành viên</span>
              </ListGroup.Item>
              <ListGroup.Item
                action
                className="d-flex align-items-center gap-3 border-0"
              >
                <Settings size={16} />
                <span>Cài đặt nâng cao</span>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      )} */}
    </div>
  );
};

export default GroupSidebar;
