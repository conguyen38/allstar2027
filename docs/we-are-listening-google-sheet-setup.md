# Đồng bộ form "We Are Listening" vào Google Sheet

Trang `/we-are-listening/` là site tĩnh (Astro), nên cách đơn giản và không cần
backend riêng để ghi dữ liệu vào Google Sheet là dùng **Google Apps Script Web App**
gắn với chính Google Sheet của BTC. Thực hiện 1 lần theo các bước sau (khoảng 5 phút):

## 1. Tạo Google Sheet

1. Tạo 1 Google Sheet mới, đặt tên ví dụ `Allstar - We Are Listening`.
2. Ở dòng 1, tạo các cột (đúng thứ tự để khớp script bên dưới):

   ```
   Timestamp | Vai trò | Khu vực | Tình trạng kỳ vừa rồi | Mô tả vấn đề | Nội dung muốn cải thiện | SĐT | Nguồn trang
   ```

## 2. Tạo Apps Script gắn với Sheet đó

1. Trong Sheet, vào **Extensions → Apps Script**.
2. Xoá code mẫu, dán đoạn sau:

   ```js
   const SHEET_NAME = 'Sheet1'; // đổi nếu tên tab khác

   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
     const data = JSON.parse(e.postData.contents);

     sheet.appendRow([
       data.timestamp || new Date().toISOString(),
       data.role || '',
       data.region || '',
       data.status || '',
       data.issue_detail || '',
       data.improve || '',
       data.phone || '',
       data.page || '',
     ]);

     return ContentService
       .createTextOutput(JSON.stringify({ ok: true }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

3. Bấm **Deploy → New deployment**.
4. Chọn loại **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Bấm **Deploy**, cấp quyền khi được hỏi, rồi copy **Web app URL**
   (dạng `https://script.google.com/macros/s/XXXXXXXX/exec`).

## 3. Gắn URL vào code

Mở `src/pages/we-are-listening/index.astro`, tìm dòng:

```js
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';
```

Thay bằng URL vừa copy ở bước 2, rồi deploy lại site.

## Lưu ý

- Vì Apps Script Web App không trả CORS header, form gửi request ở chế độ
  `no-cors`, nên trình duyệt sẽ **không đọc được response** — trang tự chuyển
  sang màn "Cảm ơn" ngay sau khi gửi (không thể phát hiện lỗi phía Google ở
  phía client). Nếu cần chắc chắn dữ liệu đã vào Sheet, kiểm tra trực tiếp
  trong Google Sheet hoặc xem log tại **Apps Script → Executions**.
- Mỗi lần sửa nội dung script, phải **Deploy → Manage deployments → Edit → New
  version** thì URL cũ mới nhận code mới.
- Không cần thêm domain `onehousing.club` vào CORS vì Apps Script không kiểm
  tra origin khi access là "Anyone".
