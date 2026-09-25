# BÁO CÁO BÀI TẬP THỰC HÀNH LAB 2a
## BACKEND VỚI NODE.JS — MICROSERVICES

---

### 1. THÔNG TIN SINH VIÊN
- **Họ và tên:** Nguyễn Thái Tuấn
- **Mã sinh viên (MSV):** N23DCPT054
- **Lớp:** D23CQPTUD01-N
- **Môn học:** Lập Trình Web

---

### 2. MÔ TẢ TỔNG QUAN DỰ ÁN

Dự án là hệ thống Backend thương mại điện tử hoàn chỉnh được thiết kế và triển khai theo mô hình **Kiến trúc Microservices**, tuân thủ nghiêm ngặt theo tài liệu yêu cầu `Lab2a.pdf`. Hệ thống phân chia độc lập các nghiệp vụ thành các dịch vụ độc lập, sử dụng đa cơ sở dữ liệu (Polyglot Persistence), tích hợp hàng đợi bộ nhớ đệm (Cache) tốc độ cao và bảo vệ toàn bộ API qua Cổng điều hướng tập trung (API Gateway).

#### 2.1. Các dịch vụ trong hệ thống:
1. **API Gateway (Port 3000):**
   - Đóng vai trò là điểm tiếp nhận (Single Entry Point) cho toàn bộ Client bên ngoài.
   - Định tuyến yêu cầu (Reverse Proxy) tới các microservice nội bộ: `/api/products` (Product Service), `/api/orders` (Order Service), `/api/auth` (Auth Service).
   - Tích hợp Middleware bảo mật: **Rate Limiting** (giới hạn tần suất request chống DDoS/spam), **CORS**, và **JWT Authentication Middleware** bảo vệ các route yêu cầu xác thực.
   - Chuẩn hóa định dạng phản hồi và xử lý lỗi tập trung.

2. **Auth Service (Port 3003):**
   - Đảm nhiệm nghiệp vụ xác thực người dùng và phân quyền.
   - Lưu trữ thông tin tài khoản trên **PostgreSQL** qua **Prisma ORM**.
   - Bảo mật mật khẩu bằng thuật toán **bcrypt (salt rounds = 10)**.
   - Cấp phát và xác minh **JWT (JSON Web Token)** gồm Access Token và Refresh Token.
   - Cung cấp các endpoint: Đăng ký (`/api/auth/register`), Đăng nhập (`/api/auth/login`), Lấy thông tin user hiện tại (`/api/auth/me`).

3. **Product Service (Port 3001):**
   - Quản lý danh mục (`Category`) và sản phẩm (`Product`), lưu trữ trên cơ sở dữ liệu quan hệ **PostgreSQL** thông qua **Prisma ORM**.
   - Hỗ trợ đầy đủ các thao tác CRUD với kiểm tra tính toàn vẹn dữ liệu (Data Validation).
   - Tích hợp tìm kiếm theo từ khóa (`search`), lọc theo khoảng giá (`minPrice`, `maxPrice`), lọc theo danh mục, trạng thái tồn kho và phân trang (`page`, `limit`).
   - Áp dụng kỹ thuật **Xóa mềm (Soft Delete)** qua trường `deletedAt` hoặc `isDeleted` để bảo toàn dữ liệu lịch sử đơn hàng.
   - Hỗ trợ upload ảnh sản phẩm qua `multipart/form-data` với Multer.
   - Tối ưu hiệu năng bằng **Redis Cache**: Tự động lưu cache kết quả tìm kiếm/danh sách sản phẩm và tự động làm sạch (Cache Invalidation) khi dữ liệu có thay đổi (Create/Update/Delete).
   - Tích hợp tài liệu tương tác **Swagger UI** tại đường dẫn `/api-docs`.

4. **Order Service (Port 3002):**
   - Quản lý quy trình đặt hàng và vòng đời trạng thái đơn hàng.
   - Lưu trữ dữ liệu dạng Document linh hoạt trên **MongoDB** thông qua **Mongoose ODM**.
   - Tự động sinh mã đơn hàng duy nhất dạng `ORD-XXXXXX-XXXX` kèm kiểm tra tính hợp lệ của giỏ hàng (`items`), tính toán tự động tổng tiền đơn hàng (`totalAmount`).
   - Cập nhật trạng thái đơn hàng theo chu trình: `pending` ➔ `confirmed` ➔ `processing` ➔ `shipped` ➔ `delivered` (hoặc `cancelled`).
   - Hỗ trợ tra cứu và cập nhật linh hoạt bằng cả MongoDB `ObjectId` lẫn mã đơn hàng `orderCode`, xử lý lỗi chặt chẽ, không gây crash `500 CastError`.
   - Tích hợp tài liệu **Swagger UI** tại đường dẫn `/api-docs`.

---

### 3. SƠ ĐỒ CẤU TRÚC DỰ ÁN (PROJECT TREE)

```text
N23DCPT054_NguyenThaiTuan_Web_Prac2a/
├── .gitignore                                  # Cấu hình bỏ qua tệp tin bảo mật toàn bộ repo
├── README.md                                   # Tài liệu hướng dẫn & báo cáo đồ án
├── postman/
│   └── Lab2.postman_collection.json            # Kịch bản kiểm thử Postman API đầy đủ có automation test script
└── microservices-shop/
    ├── .env.example                            # Mẫu cấu hình tất cả biến môi trường cho các service
    ├── docker-compose.yml                      # Cấu hình Docker Compose khởi chạy 7 container đồng bộ
    ├── docker-compose.dev.yml                  # Cấu hình Docker Compose môi trường phát triển (Hot reload)
    │
    ├── api-gateway/                            # [Service] API Gateway (Port 3000)
    │   ├── Dockerfile                          # Multi-stage Docker build
    │   ├── .dockerignore
    │   ├── package.json
    │   └── src/
    │       ├── index.js                        # Điểm khởi chạy Gateway, cấu hình proxy & rate limiter
    │       └── middleware/
    │           └── auth.js                     # Middleware xác thực JWT token
    │
    ├── auth-service/                           # [Service] Authentication Service (Port 3003)
    │   ├── Dockerfile
    │   ├── .dockerignore
    │   ├── package.json
    │   ├── prisma/
    │   │   └── schema.prisma                   # Schema User & Authentication
    │   └── src/
    │       ├── app.js                          # Cấu hình Express app
    │       ├── index.js                        # Lắng nghe server
    │       ├── controllers/
    │       │   └── authController.js           # Xử lý đăng ký, đăng nhập, trả JWT
    │       ├── middleware/
    │       │   └── authMiddleware.js           # Kiểm tra header Bearer Token
    │       ├── routes/
    │       │   └── authRoutes.js               # Định tuyến API Auth
    │       └── swagger/
    │           └── swagger.js                  # Cấu hình OpenAPI 3.0
    │
    ├── product-service/                        # [Service] Product Service (Port 3001)
    │   ├── Dockerfile
    │   ├── .dockerignore
    │   ├── package.json
    │   ├── prisma/
    │   │   ├── schema.prisma                   # Schema Product, Category (PostgreSQL)
    │   │   ├── seed.js                         # Script nạp dữ liệu mẫu ban đầu
    │   │   └── migrations/                     # Lịch sử migration cơ sở dữ liệu
    │   └── src/
    │       ├── app.js                          # Cấu hình Express & Swagger
    │       ├── index.js                        # Lắng nghe server & kết nối DB
    │       ├── config/
    │       │   └── redis.js                    # Kết nối Redis & cơ chế Cache
    │       ├── controllers/
    │       │   └── productController.js        # Nghiệp vụ CRUD sản phẩm, soft delete, lọc, phân trang
    │       ├── middleware/
    │       │   ├── errorHandler.js             # Xử lý lỗi toàn cục
    │       │   ├── upload.js                   # Cấu hình Multer upload hình ảnh
    │       │   └── validate.js                 # Kiểm tra tính hợp lệ đầu vào
    │       ├── routes/
    │       │   └── productRoutes.js            # Định tuyến /api/products
    │       └── swagger/
    │           └── swagger.js                  # Cấu hình OpenAPI / Swagger UI
    │
    └── order-service/                          # [Service] Order Service (Port 3002)
        ├── Dockerfile
        ├── .dockerignore
        ├── package.json
        └── src/
            ├── app.js                          # Cấu hình Express app & Swagger
            ├── index.js                        # Lắng nghe server & kết nối MongoDB
            ├── models/
            │   └── Order.js                    # Mongoose Model: Order, OrderItems, Address
            ├── controllers/
            │   └── orderController.js          # Tạo đơn, tính tiền, cập nhật trạng thái đơn
            ├── routes/
            │   └── orderRoutes.js              # Định tuyến /api/orders
            └── swagger/
                └── swagger.js                  # Cấu hình OpenAPI / Swagger UI
```

---

### 4. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY (QUAN TRỌNG)

Khi clone repository này về máy, có thể lựa chọn 1 trong 2 phương pháp triển khai dưới đây:

#### 🟢 CÁCH 1: TRIỂN KHAI NHANH BẰNG DOCKER COMPOSE (KHUYÊN DÙNG)

##### Bước 1: Clone mã nguồn về máy
```bash
git clone https://github.com/LuckSnow/N23DCPT054_NguyenThaiTuan_Web_Prac2a.git
cd N23DCPT054_NguyenThaiTuan_Web_Prac2a
```

##### Bước 2: Kiểm tra Docker Desktop
Đảm bảo phần mềm **Docker Desktop** đang chạy trên máy tính của bạn.

##### Bước 3: Khởi chạy toàn bộ hệ thống
Di chuyển vào thư mục `microservices-shop` và thực hiện lệnh build:
```bash
cd microservices-shop
docker compose up -d --build
```

Docker Compose sẽ tự động khởi tạo 7 containers hoạt động đồng bộ:
1. `postgres_db`: PostgreSQL 15 (Port `5432:5432`)
2. `mongo_db`: MongoDB 7 (Port `27017:27017`)
3. `redis_cache`: Redis 7 (Port `6379:6379`)
4. `product_service`: Node.js Express + Prisma (Port `3001:3001`)
5. `order_service`: Node.js Express + Mongoose (Port `3002:3002`)
6. `auth_service`: Node.js Express + JWT (Port `3003:3003`)
7. `api_gateway`: API Gateway trung tâm (Port `3000:3000`)

##### Bước 4: Kiểm tra trạng thái các container
```bash
docker compose ps
```
Nếu tất cả các container hiển thị trạng thái `Up` hoặc `healthy` là hệ thống đã sẵn sàng phục vụ.

---

#### 🟡 CÁCH 2: TRIỂN KHAI THỦ CÔNG (LOCAL DEVELOPMENT VỚI NODE.JS)


##### Yêu cầu môi trường:
- Node.js version 18 trở lên (`node -v`)
- npm version 9 trở lên (`npm -v`)
- Docker (chạy DB cục bộ) HOẶC tài khoản Cloud Database (Supabase + MongoDB Atlas)

##### Bước 1: Chuẩn bị file cấu hình môi trường (.env)
Sao chép cấu hình từ file mẫu:
```bash
cd microservices-shop
cp .env.example .env
```
Thiết lập các chuỗi kết nối:
- `DATABASE_URL`: Đường dẫn kết nối PostgreSQL (Session Pooler port 5432).
- `MONGODB_URI`: Đường dẫn kết nối MongoDB Atlas hoặc Local.
- `JWT_SECRET`: Khóa bí mật ký token (tối thiểu 32 ký tự).
- `REDIS_HOST`: `localhost` hoặc `127.0.0.1`.

##### Bước 2: Cài đặt dependencies và chuẩn bị cơ sở dữ liệu

1. **Khởi tạo Product Service (PostgreSQL & Redis):**
```bash
cd microservices-shop/product-service
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed       # Nạp danh mục và sản phẩm mẫu ban đầu
npm run dev        # Chạy trên port 3001
```

2. **Khởi tạo Order Service (MongoDB):**
```bash
cd ../order-service
npm install
npm run dev        # Chạy trên port 3002
```

3. **Khởi tạo Auth Service:**
```bash
cd ../auth-service
npm install
npx prisma generate
npx prisma db push
npm run dev        # Chạy trên port 3003
```

4. **Khởi tạo API Gateway:**
```bash
cd ../api-gateway
npm install
npm run dev        # Chạy trên port 3000
```

---

### 5. HƯỚNG DẪN KIỂM THỬ HỆ THỐNG VỚI POSTMAN

Kiểm thử đã được chuẩn bị sẵn trong tệp [postman/Lab2.postman_collection.json](file:///d:/N23DCPT054_NguyenThaiTuan_Web_Prac2a/postman/Lab2.postman_collection.json).

#### 5.1. Import Collection vào Postman:
1. Mở phần mềm **Postman**.
2. Nhấn nút **Import** ở góc trên bên trái ➔ Chọn tệp `postman/Lab2.postman_collection.json`.
3. Kiểm tra biến trong Collection Variables:
   - `gateway_url`: `http://localhost:3000`
   - `jwt_token`: Tự động được gán khi bạn đăng nhập thành công.
   - `order_id` & `order_code`: Tự động được gán khi bạn tạo đơn hàng mới.

#### 5.2. Thứ tự thực hiện kịch bản kiểm thử chuẩn:
1. **Kiểm tra sức khỏe dịch vụ (Health Check):**
   - Chạy `GET API Gateway Health`, `GET Product Service Health`, `GET Order Service Health`, `GET Auth Service Health` ➔ Tất cả trả về HTTP status `200 OK`.
2. **Đăng ký và Đăng nhập (Auth Service):**
   - Chạy `POST /api/auth/register` với thông tin mẫu:
     ```json
     {
       "email": "tuan@example.com",
       "password": "password123",
       "name": "Nguyễn Thái Tuấn"
     }
     ```
   - Chạy `POST /api/auth/login` ➔ Postman sẽ tự động trích xuất chuỗi `accessToken` và lưu vào biến `{{jwt_token}}`.
   - Chạy `GET /api/auth/me` để xác thực token hợp lệ.
3. **Thao tác với Sản phẩm (Product Service):**
   - `GET /api/products`: Lấy danh sách kèm phân trang và kiểm tra cache Redis.
   - `POST /api/products`: Tạo mới sản phẩm ➔ Postman tự lưu `product_id`.
   - `PUT /api/products/:id`: Cập nhật thông tin và kiểm tra cơ chế xóa cache.
   - `DELETE /api/products/:id`: Xóa mềm sản phẩm.
4. **Quy trình đặt và cập nhật đơn hàng (Order Service):**
   - Chạy `POST /api/orders` (yêu cầu Token): Gửi thông tin giỏ hàng kèm địa chỉ giao hàng ➔ **Postman tự động lưu `_id` của MongoDB vào biến `{{order_id}}` và mã đơn vào `{{order_code}}`**.
   - Chạy `GET /api/orders/{{order_id}}` hoặc `GET /api/orders/{{order_code}}` để xem chi tiết.
   - Chạy `PUT /api/orders/{{order_id}}/status` để đổi trạng thái sang `confirmed` ➔ **Thành công 200 OK (không còn bị lỗi Cast to ObjectId)**.
   - Chạy tiếp các bước đổi trạng thái: `processing` ➔ `shipped` ➔ `delivered`.

---

### 6. XEM TÀI LIỆU TRỰC QUAN QUA SWAGGER UI

Hệ thống tích hợp sẵn tài liệu chuẩn OpenAPI 3.0 với giao diện Swagger UI tương tác trực tiếp:
- **Product Service API Docs:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **Order Service API Docs:** [http://localhost:3002/api-docs](http://localhost:3002/api-docs)
- **Auth Service API Docs:** [http://localhost:3003/api-docs](http://localhost:3003/api-docs)

