// components/Group/GroupHeader.js
import React, { useState } from "react";
import { Users, Settings, Share, MoreHorizontal } from "lucide-react";
import { Button, Dropdown } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import "./GroupHeader.css";

const GroupHeader = ({ group, isMember, userRole, onJoin, onLeave }) => {
  const { user } = useAuth();

  const getPrivacyIcon = () => {
    switch (group.visibility) {
      case "public":
        return "🌍";
      case "private":
        return "🔒";
      case "invite":
        return "📨";
      default:
        return "🔒";
    }
  };

  const getPrivacyText = () => {
    switch (group.visibility) {
      case "public":
        return "Nhóm công khai";
      case "private":
        return "Nhóm riêng tư";
      case "invite":
        return "Nhóm chỉ theo lời mời";
      default:
        return "Nhóm riêng tư";
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: group.name,
        text: group.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Hiển thị toast thông báo đã copy
    }
  };

  return (
    <div className="group-header ">
      <div className="group-cover">
        <div
          className="cover-image"
          style={{
            backgroundImage: group.coverPhoto
              ? `url(${group.coverPhoto})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />

        <div className="cover-overlay">
          <div className="container">
            <div className="row align-items-end">
              <div className="col-md-8">
                <div className="group-info">
                  <div className="group-avatar">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="rounded-circle"
                      />
                    ) : (
                      <div className="avatar-placeholder rounded-circle">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="group-details">
                    <h1 className="group-name">{group.name}</h1>
                    <div className="group-meta">
                      <span className="badge bg-light text-dark me-2">
                        {getPrivacyIcon()} {getPrivacyText()}
                      </span>
                      <span className="text-white me-3">
                        <Users size={16} className="me-1" />
                        {group.memberCount} thành viên
                      </span>
                      {group.category && group.category.length > 0 && (
                        <span className="badge bg-primary">
                          {group.category[0]}
                        </span>
                      )}
                    </div>

                    <p className="group-description text-white">
                      {group.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="group-actions">
                  {user && (
                    <>
                      {!isMember ? (
                        <Button
                          variant="primary"
                          size="lg"
                          className="join-btn"
                          onClick={onJoin}
                        >
                          Tham gia nhóm
                        </Button>
                      ) : (
                        <div className="member-actions">
                          {userRole === "owner" && (
                            <span className="badge bg-warning me-2">
                              Chủ nhóm
                            </span>
                          )}
                          {userRole === "moderator" && (
                            <span className="badge bg-info me-2">
                              Quản trị viên
                            </span>
                          )}

                          <Button
                            variant="outline-light"
                            size="sm"
                            className="leave-btn"
                            onClick={onLeave}
                          >
                            Rời nhóm
                          </Button>
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-2">
                        <Button
                          variant="outline-light"
                          size="sm"
                          onClick={handleShare}
                          title="Chia sẻ nhóm"
                        >
                          <Share size={16} />
                        </Button>

                        <Dropdown>
                          <Dropdown.Toggle variant="outline-light" size="sm">
                            <MoreHorizontal size={16} />
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            <Dropdown.Item>
                              <Settings size={16} className="me-2" />
                              Báo cáo nhóm
                            </Dropdown.Item>
                            <Dropdown.Item>Chặn nhóm</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupHeader;
