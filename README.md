# English Cards

Website tĩnh tự host: mỗi trang PDF là một thẻ, đọc tiếng Anh bằng giọng của trình duyệt. Có thư viện nhiều bài, giữ bài cũ khi thêm bài mới. Đã kèm nguyên bản `bub.pdf` (20 trang) và lời đọc được kiểm tra cho cả các trang chữ nằm trong ảnh.

Không cần tài khoản ChatGPT, API key, database hoặc dịch vụ Sites. Không có chi phí API đọc giọng. Giọng và khả năng phát âm phụ thuộc thiết bị/trình duyệt; một số giọng cần mạng. PDF và lời đọc trong website được truy cập theo quyền của hosting (thông thường là công khai).

## Chạy trên máy

Cài Node.js 22 hoặc mới hơn. Trong thư mục project chạy:

```sh
npm run dev
```

Mở http://127.0.0.1:4173. Không cần `npm install`. Không mở `index.html` trực tiếp bằng cách nhấp đúp vì trình duyệt cần HTTP để đọc PDF và thư viện.

## Thêm PDF mới bằng tay — giữ bài cũ

1. Tạo thư mục mới, ví dụ `public/lessons/bai-02/`.
2. Chép PDF mới vào đó, ví dụ `lesson.pdf`. Giữ nguyên các thư mục cũ.
3. Thêm một mục vào cuối mảng trong `public/lessons.json` (có dấu phẩy giữa các mục):

```json
[
  {
    "id": "bub",
    "title": "Bub · Bài học đầu tiên",
    "pdf": "lessons/bub/bub.pdf",
    "texts": "lessons/bub/texts.json"
  },
  {
    "id": "bai-02",
    "title": "Bài 02 · Động vật",
    "pdf": "lessons/bai-02/lesson.pdf"
  }
]
```

4. Đăng các file mới và `lessons.json` lên cùng hosting/repository. Bài cũ vẫn xuất hiện trong danh sách.

ID dùng chữ thường không dấu, số và dấu gạch ngang; mỗi bài có ID riêng. Khi cập nhật PDF mà vẫn muốn giữ bản trước, thêm thành bài mới, ví dụ `bai-02-v2`, thay vì ghi đè file cũ. Website không tự tạo lịch sử cho file bị ghi đè hoặc bị xóa.

### Thêm nhanh bằng lệnh (tùy chọn)

```sh
npm run add-lesson -- "C:/Users/LocNg/Downloads/bai-moi.pdf" bai-02 "Bài 02 · Động vật"
npm run check
```

Lệnh sao chép PDF, tạo file lời đọc rỗng và bổ sung thư viện. Lệnh từ chối ID hoặc thư mục đã tồn tại để tránh ghi đè bài cũ. Bản PDF gốc bên ngoài project không bị sửa.

## Lời đọc tiếng Anh

- PDF có chữ thật: website tự lấy chữ của từng trang.
- PDF scan/ảnh: không có OCR; nhập lời đọc trong phần **Tùy chỉnh giọng đọc & nội dung**.
- Sửa trên website được lưu trong trình duyệt, riêng từng bài. Sửa này không tự ghi vào GitHub/hosting.
- Nhấn **Tải lời đọc (.json)**, đổi tên file tải về thành `texts.json`, chép vào thư mục đúng bài. Thêm trường `"texts": "lessons/bai-02/texts.json"` vào mục bài trong `lessons.json` rồi đăng lại.
- File lời đọc có dạng `{"1": "Cat", "2": "Dog"}`; số là trang PDF, bắt đầu từ 1. Trang không khai báo sẽ lấy chữ trong PDF. Chuỗi rỗng sẽ tắt lời đọc của trang đó.
- Sửa lưu trên trình duyệt được ưu tiên hơn file lời đọc. Khi kiểm tra lời đọc mới đã đăng, dùng cửa sổ riêng tư hoặc xóa dữ liệu trang nếu trước đó đã sửa cục bộ.
- Mỗi PDF tối đa 300 trang. Nên chia thành các bài ngắn để mở nhanh trên điện thoại.

## Đưa lên GitHub Pages

1. Tạo repository GitHub rồi đưa **nội dung thư mục project này** vào thư mục gốc repository. Nhớ có cả `.github/workflows/pages.yml`.
2. Dùng nhánh `main` (hoặc sửa tên nhánh trong workflow).
3. Vào **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push thay đổi hoặc vào **Actions → Publish English Cards → Run workflow**.

Workflow kiểm tra bài học và xuất bản thư mục `public`. Mọi đường dẫn đều tương đối nên hoạt động cả dưới `/ten-repository/`. Những lần thêm PDF sau, chỉ cần commit/push các file mới và thư viện.

Tài liệu: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Đưa lên Vercel

Import repository chứa project. Root Directory là thư mục project (nếu repository chỉ chứa project thì để mặc định). Framework Preset: **Other**. Không cần Build Command; Output Directory: **public**. File `vercel.json` đã khai báo thư mục xuất bản và kiểu nội dung cho thư viện PDF. Push cập nhật PDF/thư viện để triển khai lại.

Tài liệu: https://vercel.com/docs/builds/configure-a-build

## Hosting tĩnh khác

Upload **toàn bộ nội dung bên trong `public/`**, giữ nguyên cấu trúc thư mục. Hosting phải phục vụ `.mjs` với kiểu JavaScript (`text/javascript` hoặc `application/javascript`). Không cần server Node trong môi trường thật.

## Cấu trúc

```text
public/
  index.html, app.js, style.css
  lessons.json                 # Danh sách bài học
  lessons/
    bub/bub.pdf                # PDF gốc được giữ nguyên
    bub/texts.json             # Lời đọc từng trang
  vendor/                      # PDF.js đi kèm, không tải từ CDN
scripts/
  serve.mjs                    # Xem thử
  add-lesson.mjs                # Thêm bài, không ghi đè
  check.mjs                    # Kiểm tra dữ liệu
.github/workflows/pages.yml
vercel.json
```

## Kiểm tra trước khi đăng

```sh
npm run check
```

Kiểm tra ID trùng, file bị thiếu, định dạng PDF và cấu trúc lời đọc. Sau đó mở bằng `npm run dev`, chọn bài, chuyển thẻ và thử nút loa. Lệnh kiểm tra không thay thế việc xem nội dung PDF.

Thư viện PDF.js 4.10.38 được phân phối theo Apache-2.0; xem `public/vendor/LICENSE`. Nội dung PDF thuộc chủ sở hữu tương ứng.

## Mở PDF tạm từ giao diện

Nhấn **Mở PDF từ máy** và chọn PDF (tối đa 30 MB, 300 trang). Mỗi trang trở thành một thẻ; dùng nút loa và chuyển thẻ như bài trong thư viện. File chỉ được đọc trong bộ nhớ trình duyệt, không gửi lên máy chủ, không thêm vào `lessons.json`, không lưu PDF hoặc lời sửa vào bộ nhớ lâu dài. Chọn bài khác hoặc tải lại trang sẽ bỏ bài tạm. PDF không có lớp chữ cần nhập lời đọc thủ công. Nếu mở file lỗi, bài đang học được giữ nguyên.
