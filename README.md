# BÁO CÁO BÀI TẬP THỰC HÀNH LAB 2a
## BACKEND VỚI NODE.JS — MICROSERVICES

### 1. Thông tin sinh viên
- **Họ và tên:** Nguyễn Thái Tuấn
- **Mã sinh viên (MSV):** N23DCPT054
- **Lớp / Học phần:** Thực hành Web (Web Practice 2a)

---

### 2. Mô tả ngắn về bài làm
Dự án được xây dựng theo kiến trúc Microservices dựa trên tài liệu hướng dẫn `Lab 2a: Backend với Node.js — Microservices`:

1. **Kiến trúc hệ thống:**
   - **API Gateway (Port 3000):** Điểm vào duy nhất của hệ thống, xử lý proxy routing tới các service con (`/api/products`, `/api/orders`), tích hợp Rate Limiting (100 req/15 phút) và CORS.
   - **Product Service (Port 3001):** Quản lý sản phẩm và danh mục, kết nối cơ sở dữ liệu PostgreSQL (hosted trên Supabase) thông qua **Prisma ORM**, hỗ trợ đầy đủ CRUD, validation dữ liệu, soft delete, lọc, phân trang, sắp xếp và tài liệu Swagger UI.
   - **Order Service (Port 3002):** Quản lý đơn hàng, kết nối cơ sở dữ liệu MongoDB thông qua **Mongoose ODM**, tự động sinh mã đơn hàng `orderCode`, tính toán tổng tiền, cập nhật trạng thái đơn hàng.

2. **Khắc phục lỗi và cấu hình kỹ thuật:**
   - Đã khắc phục lỗi `npx prisma migrate dev --name init` không kết nối được tới Supabase do cấu hình port transaction pooler (6543) không hỗ trợ advisory locks trong migration; đã chuyển sang session pooler (port 5432) và đồng bộ schema thành công.
   - Thêm schema migration và seed dữ liệu ban đầu cho danh mục và sản phẩm mẫu.
   - Tích hợp tài liệu OpenAPI 3.0 với **Swagger UI** tại `/api-docs` cho Product Service.
   - Cung cấp Dockerfile multi-stage build cho từng service và `docker-compose.yml` để khởi chạy đồng bộ toàn bộ hệ thống gồm cơ sở dữ liệu và các microservices.

3. **Bảo mật và an toàn thông tin:**
   - Thiết lập `.gitignore` ở root và các thư mục con, bảo vệ toàn bộ biến môi trường (`.env`), database credentials, API keys không bị rò rỉ lên Git.
   - Cung cấp template `.env.example` với các giá trị mẫu cho việc triển khai.
