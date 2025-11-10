// components/Group/Group.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import groupService from "../../services/groupService";
import GroupHeader from "./GroupHeader";
import GroupSidebar from "./GroupSidebar";
import GroupFeed from "./GroupFeed";
import GroupMembers from "./GroupMembers";
import GroupImage from "./GroupImage";
import GroupSettings from "./GroupSettings";
import CreatePost from "../../pages/social/CreatePost"; // Sửa đường dẫn này

import { Alert, Loader } from "../UI";
import "./Group.css";

const Group = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [userRole, setUserRole] = useState(null);
  const [isMember, setIsMember] = useState(false);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const response = await groupService.getGroup(groupId);

      if (response.success) {
        setGroup(response.group);
        checkUserMembership();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tải thông tin nhóm");
    } finally {
      setLoading(false);
    }
  };

  const checkUserMembership = async () => {
    if (!user) return;

    try {
      const response = await groupService.getGroupMembers(groupId, {
        limit: 100,
      });

      console.log("response: ", response);

      const currentUserMember = response.members.find(
        (member) => member.userId._id === (user.userId || user.id)
      );

      console.log("currentUserMember: ", currentUserMember);

      if (currentUserMember) {
        setIsMember(true);
        setUserRole(currentUserMember.role);
      }
    } catch (err) {
      console.error("Error checking membership:", err);
    }
  };

  const handleJoinGroup = async () => {
    try {
      const response = await groupService.joinGroup(groupId);
      if (response.success) {
        await loadGroup();
        // Hiển thị thông báo thành công
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tham gia nhóm");
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Bạn có chắc muốn rời nhóm này?")) {
      try {
        const response = await groupService.leaveGroup(groupId);
        if (response.success) {
          setIsMember(false);
          setUserRole(null);
          // Hiển thị thông báo thành công
        }
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi rời nhóm");
      }
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  if (loading) {
    return (
      <div className="group-container">
        <Loader message="Đang tải thông tin nhóm..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-container">
        <Alert variant="error" message={error} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-container">
        <Alert variant="error" message="Không tìm thấy nhóm" />
      </div>
    );
  }

  const canPost = isMember || group.visibility === "public";
  const isAdmin = ["owner", "moderator"].includes(userRole);

  return (
    <div className="group-page container">
      {/* Header */}
      <GroupHeader
        group={group}
        isMember={isMember}
        userRole={userRole}
        onJoin={handleJoinGroup}
        onLeave={handleLeaveGroup}
      />

      <div className="group-content">
        {/* Sidebar */}
        <div className="group-sidebar">
          <GroupSidebar
            group={group}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMember={isMember}
            isAdmin={isAdmin}
          />
        </div>
        {/* Main Content */}
        <div className="group-main">
          {activeTab === "feed" && (
            <>
              {/* {canPost && user && (
                <CreatePost
                  idOfGroup={groupId}
                  onPostCreated={loadGroup}
                  placeholder={`Bạn đang nghĩ gì, ${user.fullName}?`}
                />
              )} */}

              <GroupFeed groupId={groupId} canPost={canPost} />
            </>
          )}

          {activeTab === "members" && (
            <GroupMembers
              groupId={groupId}
              isAdmin={isAdmin}
              onMembersUpdate={loadGroup}
            />
          )}

          {activeTab === "images" && <GroupImage groupId={groupId} />}

          {activeTab === "settings" && isAdmin && (
            <GroupSettings group={group} onGroupUpdate={loadGroup} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Group;
