# Admin Panel - MindSpace

## Tổng quan

Admin Panel là hệ thống quản trị dành cho người dùng có role "admin" trong ứng dụng MindSpace. Hệ thống cung cấp các tính năng quản lý toàn diện cho người dùng, nội dung và thống kê hệ thống.

## Tính năng chính

### 1. Dashboard Admin (`/admin`)

- **Thống kê tổng quan**: Tổng số người dùng, bài viết, nhật ký, nhóm
- **Thống kê tuần**: Số lượng mới trong tuần
- **Hoạt động gần đây**: Người dùng và bài viết mới nhất
- **Thống kê cảm xúc**: Phân tích cảm xúc của người dùng

### 2. Quản lý người dùng (`/admin/users`)

- **Xem danh sách**: Tất cả người dùng với phân trang và tìm kiếm
- **Lọc theo role**: user, supporter, doctor, admin
- **Cập nhật role**: Thay đổi quyền hạn người dùng
- **Xóa người dùng**: Xóa tài khoản và dữ liệu liên quan
- **Xem chi tiết**: Thông tin cá nhân và thống kê hoạt động

### 3. Quản lý nội dung (`/admin/content`)

- **Quản lý bài viết**: Xem, xóa bài viết
- **Quản lý nhật ký**: Xem, xóa nhật ký cá nhân
- **Quản lý nhóm**: Xem, xóa nhóm
- **Tìm kiếm**: Tìm kiếm nội dung theo từ khóa

## Cấu trúc Backend

### Routes (`/backend/routes/admin.js`)

```javascript
// Dashboard
GET /admin/dashboard - Thống kê tổng quan

// Quản lý người dùng
GET /admin/users - Danh sách người dùng
GET /admin/users/:userId - Chi tiết người dùng
PUT /admin/users/:userId - Cập nhật thông tin
DELETE /admin/users/:userId - Xóa người dùng
PUT /admin/users/:userId/role - Cập nhật role

// Quản lý nội dung
GET /admin/posts - Danh sách bài viết
DELETE /admin/posts/:postId - Xóa bài viết
GET /admin/journals - Danh sách nhật ký
DELETE /admin/journals/:journalId - Xóa nhật ký
GET /admin/groups - Danh sách nhóm
DELETE /admin/groups/:groupId - Xóa nhóm

// Báo cáo
GET /admin/reports/users - Báo cáo người dùng
GET /admin/reports/posts - Báo cáo bài viết
GET /admin/reports/activity - Báo cáo hoạt động
```

### Middleware (`/backend/middleware/adminAuth.js`)

- Kiểm tra đăng nhập
- Kiểm tra quyền admin
- Thêm thông tin admin vào request

### Controller (`/backend/controllers/adminController.js`)

- Xử lý logic nghiệp vụ
- Tương tác với database
- Trả về dữ liệu JSON

## Cấu trúc Frontend

### Components

- `AdminLayout.js` - Layout chung cho admin panel
- `ProtectedAdminRoute.js` - Route bảo vệ chỉ cho admin
- `AdminDashboard.js` - Trang dashboard
- `AdminUserManagement.js` - Quản lý người dùng
- `AdminContentManagement.js` - Quản lý nội dung

### Services

- `adminService.js` - API calls cho admin

### Routes

```javascript
/admin - Dashboard
/admin/users - Quản lý người dùng
/admin/content - Quản lý nội dung
```

## Cách sử dụng

### 1. Tạo Admin User

```bash
cd backend
node createAdmin.js
```

Thông tin đăng nhập mặc định:

- **Email**: admin@mindspace.com
- **Username**: admin
- **Password**: admin123

### 2. Truy cập Admin Panel

1. Đăng nhập với tài khoản admin
2. Click vào avatar → "Admin Panel"
3. Hoặc truy cập trực tiếp `/admin`

### 3. Quản lý người dùng

1. Vào `/admin/users`
2. Sử dụng tìm kiếm và lọc
3. Click vào dropdown role để thay đổi quyền
4. Click nút xóa để xóa người dùng

### 4. Quản lý nội dung

1. Vào `/admin/content`
2. Chọn tab: Posts, Journals, Groups
3. Xem và xóa nội dung không phù hợp

## Bảo mật

### Backend

- Middleware `auth` kiểm tra JWT token
- Middleware `adminAuth` kiểm tra role admin
- Không cho phép admin xóa chính mình

### Frontend

- `ProtectedAdminRoute` kiểm tra quyền admin
- Chỉ hiển thị link admin cho user có role admin
- Redirect về trang chủ nếu không có quyền

## API Endpoints

### Authentication Required

Tất cả endpoints admin đều yêu cầu:

- Header: `Authorization: Bearer <token>`
- Role: `admin`

### Response Format

```javascript
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Format

```javascript
{
  "success": false,
  "message": "Error message"
}
```

## Phát triển thêm

### Thêm tính năng mới

1. Thêm endpoint trong `adminController.js`
2. Thêm route trong `admin.js`
3. Thêm service trong `adminService.js`
4. Tạo component frontend
5. Thêm route trong `App.js`

### Ví dụ: Thêm quản lý bình luận

```javascript
// Backend
router.get("/admin/comments", adminController.getAllComments);
router.delete("/admin/comments/:commentId", adminController.deleteComment);

// Frontend
export const getAllComments = () => api.get("/admin/comments");
export const deleteComment = (id) => api.delete(`/admin/comments/${id}`);
```

## Troubleshooting

### Lỗi thường gặp

1. **403 Forbidden**: Kiểm tra role user có phải admin không
2. **401 Unauthorized**: Kiểm tra JWT token
3. **404 Not Found**: Kiểm tra route có đúng không

### Debug

- Kiểm tra console browser
- Kiểm tra network tab
- Kiểm tra server logs

## Liên hệ

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.
