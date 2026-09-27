# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
# 🐾 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG PET CONNECT (PET SHOP)
> **Website chính thức:** [https://vannhat.online](https://vannhat.online)  
> **Phiên bản:** 2.0.0 (FastAPI Python Backend + React Vite SPA Frontend)

---

## 📑 MỤC LỤC
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Đăng ký, Đăng nhập & Phân quyền](#2-đăng-ký-đăng-nhập--phân-quyền)
3. [Dành cho Chủ Thú Cưng (Pet Owner)](#3-dành-cho-chủ-thú-cưng-pet-owner)
4. [Dành cho Phòng Khám Thú Y (Clinic)](#4-dành-cho-phòng-khám-thú-y-clinic)
5. [Dành cho Bác Sĩ Thú Y (Veterinarian)](#5-dành-cho-bác-sĩ-thú-y-veterinarian)
6. [Dành cho Quản Trị Viên (Admin)](#6-dành-cho-quản-trị-viên-admin)
7. [Tính năng Chat Trực Tuyến & Thông Báo Realtime](#7-tính-năng-chat-trực-tuyến--thông-báo-realtime)
8. [Một số câu hỏi thường gặp (FAQ) & Khắc phục sự cố](#8-một-số-câu-hỏi-thường-gặp-faq--khắc-phục-sự-cố)

---

## 1. GIỚI THIỆU TỔNG QUAN
**Pet Connect** là nền tảng quản trị và kết nối y tế thú cưng toàn diện, giúp:
- **Chủ thú cưng:** Quản lý hồ sơ số của thú cưng, sổ bệnh án điện tử, đặt lịch khám nhanh chóng và chat tư vấn cùng bác sĩ.
- **Phòng khám & Bác sĩ:** Quản lý lịch khám bệnh nhân khoa học, tối ưu hóa quy trình khám chữa bệnh và lưu trữ bệnh án lâu dài.
- **Quản trị viên:** Giám sát toàn bộ hoạt động hệ thống, kiểm duyệt phòng khám và người dùng.

---

## 2. ĐĂNG KÝ, ĐĂNG NHẬP & PHÂN QUYỀN

### 2.1. Đăng ký tài khoản
1. Truy cập [https://vannhat.online](https://vannhat.online) và chọn **Đăng ký** (góc trên bên phải).
2. Điền đầy đủ thông tin:
   - Họ và tên
   - Địa chỉ Email (dùng để đăng nhập)
   - Số điện thoại
   - Mật khẩu (tối thiểu 6 ký tự)
   - **Loại tài khoản (Vai trò):**
     - **Chủ nuôi (Pet Owner):** Để quản lý thú cưng và đặt lịch khám.
     - **Phòng khám (Clinic):** Dành cho đại diện cơ sở phòng khám/bệnh viện thú y.
     - **Bác sĩ thú y (Veterinarian):** Dành cho bác sĩ chuyên môn tiếp nhận khám và kê đơn.
3. Bấm **Đăng ký** để hoàn tất.

### 2.2. Đăng nhập
1. Chọn **Đăng nhập**.
2. Nhập Email và Mật khẩu.
3. Sau khi đăng nhập thành công, hệ thống tự động điều hướng bạn về giao diện đúng với vai trò của mình:
   - Chủ thú cưng ➔ `/owner/dashboard`
   - Phòng khám ➔ `/clinic/dashboard`
   - Bác sĩ ➔ `/veterinarian/dashboard`
   - Quản trị viên ➔ `/admin/dashboard`

---

## 3. DÀNH CHO CHỦ THÚ CƯNG (PET OWNER)

### 3.1. Bảng điều khiển (Dashboard)
- Xem nhanh tổng số thú cưng đang sở hữu.
- Lịch hẹn khám sắp tới (ngày, giờ, bác sĩ phụ trách, phòng khám).
- Lịch tiêm nhắc lại và sổ theo dõi sức khỏe gần nhất.

### 3.2. Quản lý Hồ sơ Thú Cưng (`/owner/pets`)
- **Thêm mới thú cưng:**
  1. Bấm nút **+ Thêm thú cưng**.
  2. Tải ảnh đại diện (Avatar) của bé (hỗ trợ PNG, JPG, JPEG).
  3. Nhập tên, loài (Chó, Mèo, Chim, Thỏ,...), giống, ngày sinh/tuổi, giới tính, cân nặng.
  4. Bấm **Lưu** để tạo hồ sơ số.
- **Chỉnh sửa / Cập nhật:** Bấm vào thú cưng để cập nhật tình trạng sức khỏe, cân nặng định kỳ hoặc thay đổi ảnh đại diện.

### 3.3. Đặt lịch khám & Xem lịch hẹn (`/owner/appointments`)
1. Duyệt danh sách các **Phòng khám** (`/clinics`) hoặc **Dịch vụ** (`/services`).
2. Chọn phòng khám/bác sĩ và bấm **Đặt lịch khám**.
3. Chọn thú cưng đi khám, chọn ngày giờ khám và mô tả triệu chứng hoặc yêu cầu.
4. Bấm **Xác nhận đặt lịch**.
5. Bạn có thể theo dõi trạng thái lịch hẹn tại mục **Lịch hẹn của tôi**:
   - `PENDING` (Chờ phòng khám xác nhận)
   - `CONFIRMED` (Đã duyệt lịch)
   - `COMPLETED` (Đã khám xong)
   - `CANCELLED` (Đã hủy)

### 3.4. Sổ Bệnh Án Điện Tử (`/owner/records`)
- Xem toàn bộ lịch sử khám bệnh của từng bé.
- Xem chẩn đoán của bác sĩ, kết quả xét nghiệm, toa thuốc và lời dặn tái khám.

---

## 4. DÀNH CHO PHÒNG KHÁM THÚ Y (CLINIC)

### 4.1. Cấu hình Hồ sơ Phòng Khám (`/clinic/profile`)
- Cập nhật Logo phòng khám, hình ảnh cơ sở vật chất.
- Tên phòng khám, địa chỉ cụ thể, định vị bản đồ, số hotline và khung giờ mở cửa.

### 4.2. Quản lý Bảng Giá Dịch Vụ (`/clinic/services`)
- Bấm **+ Thêm dịch vụ**:
  - Tên dịch vụ (VD: Tiêm phòng dại 7 bệnh, Triệt sản, Cắt tỉa lông Spa, Khám tổng quát,...).
  - Đơn giá niêm yết (VNĐ), thời gian thực hiện dự kiến và mô tả chi tiết.
- Bật/tắt trạng thái hoạt động của từng dịch vụ.

### 4.3. Quản lý Lịch Khám (`/clinic/appointments`)
- Tiếp nhận các yêu cầu đặt lịch hẹn mới từ khách hàng.
- Bấm **Chấp nhận** hoặc **Từ chối** kèm lý do.
- Phân công ca khám cho bác sĩ thú y trực thuộc phòng khám.

### 4.4. Quản lý Đội ngũ Bác Sĩ (`/clinic/veterinarians`)
- Thêm bác sĩ vào danh sách nhân sự của phòng khám.
- Phân ca trực và theo dõi hiệu suất làm việc của từng bác sĩ.

---

## 5. DÀNH CHO BÁC SĨ THÚ Y (VETERINARIAN)

### 5.1. Quản lý Lịch Làm Việc (`/veterinarian/schedule`)
- Thiết lập các khung giờ có thể nhận khám trong tuần.
- Xem danh sách ca khám được phân công theo ngày/tuần.

### 5.2. Quản lý Bệnh Nhân & Hồ Sơ Bệnh Án (`/veterinarian/patients` & `/veterinarian/records`)
- **Tiếp nhận ca khám:** Xem lịch sử tiêm phòng, tiền sử bệnh án của thú cưng trước khi khám.
- **Tạo bệnh án mới:**
  1. Nhập cân nặng hiện tại, nhiệt độ, triệu chứng lâm sàng.
  2. Nhập chẩn đoán bệnh.
  3. Kê đơn thuốc (tên thuốc, liều lượng, cách dùng).
  4. Lời dặn dò chủ nuôi và hẹn ngày tái khám.
  5. Bấm **Lưu bệnh án** (bệnh án sẽ lập tức đồng bộ về tài khoản của chủ nuôi).

---

## 6. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)

- **Trang Dashboard Admin:** Thống kê tổng quan người dùng, phòng khám, doanh thu và lưu lượng truy cập.
- **Quản lý Tài khoản (`/admin/users`):** Xem danh sách tất cả tài khoản, kích hoạt, khóa tài khoản vi phạm hoặc phân quyền.
- **Kiểm duyệt Phòng Khám (`/admin/clinics`):** Duyệt các hồ sơ đăng ký mở phòng khám mới trước khi hiển thị công khai trên website.
- **Cấu hình Hệ thống (`/admin/settings`):** Tùy chỉnh các thông số vận hành nền tảng.

---

## 7. TÍNH NĂNG CHAT TRỰC TUYẾN & THÔNG BÁO REALTIME

- **Chat Trực Tuyến (`/chat`):**
  - Kết nối qua Socket.IO tốc độ cao.
  - Chủ thú cưng có thể nhắn tin trực tiếp với Bác sĩ hoặc Lễ tân phòng khám để hỏi đáp tình trạng khẩn cấp.
  - Hỗ trợ gửi tin nhắn văn bản tức thì với hiển thị trạng thái đã xem / đang nhập.
- **Thông Báo (Chuông thông báo góc trên màn hình):**
  - Nhận thông báo tự động ngay khi lịch hẹn được phê duyệt, nhắc lịch khám sắp đến, hoặc khi có đơn thuốc mới.

---

## 8. MỘT SỐ CÂU HỎI THƯỜNG GẶP (FAQ) & KHẮC PHỤC SỰ CỐ

### ❓ Tôi tải ảnh thú cưng/avatar lên nhưng không thấy hiển thị?
- **Nguyên nhân:** Có thể do trình duyệt lưu bộ nhớ đệm (cache) cũ.
- **Khắc phục:** Nhấn tổ hợp phím `Ctrl + F5` (trên Windows) hoặc `Cmd + Shift + R` (trên Mac) để làm mới hoàn toàn trang.

### ❓ Tôi quên mật khẩu đăng nhập thì làm sao?
- Liên hệ Quản trị viên qua email hỗ trợ hoặc quản trị hệ thống có thể reset mật khẩu trực tiếp trong trang Quản lý Admin.

### ❓ Hình ảnh tải lên cho phép dung lượng bao nhiêu?
- Hệ thống hỗ trợ tải lên file ảnh tối đa **50MB** với các định dạng phổ biến: `.jpg`, `.jpeg`, `.png`, `.webp`.

---
*Tài liệu được biên soạn và bảo trì bởi Bộ phận Kỹ thuật Pet Connect.*

