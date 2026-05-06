# Anthropic AI Agent - Multi-turn with Tools

Một ứng dụng Agent AI sử dụng Anthropic SDK (Claude), có khả năng hội thoại nhiều lượt (multi-turn), hỗ trợ streaming và sử dụng các công cụ (tools) để giải quyết các tác vụ thực tế như tính toán, đọc file và duyệt web.

## 🚀 Tính năng chính

- **Multi-turn Conversation**: Ghi nhớ lịch sử hội thoại để phản hồi thông minh trong các ngữ cảnh phức tạp.
- **Streaming Response**: Hiển thị câu trả lời của AI theo thời gian thực (từng từ một).
- **Tool Use (Function Calling)**: AI có khả năng tự quyết định và gọi các công cụ khi cần thiết:
    - 🧮 **Calculator**: Thực hiện các phép cộng, trừ, nhân, chia.
    - 📄 **File Reader**: Đọc nội dung các file văn bản từ hệ thống.
    - 🌐 **Web Fetcher**: Truy cập URL, tải mã HTML và sử dụng `cheerio` để lọc nội dung văn bản sạch, giúp AI nắm bắt thông tin từ internet.

## 🛠️ Công nghệ sử dụng

- **Ngôn ngữ**: TypeScript
- **Runtime**: Node.js
- **SDK**: `@anthropic-ai/sdk`
- **Thư viện bổ trợ**:
    - `dotenv`: Quản lý biến môi trường.
    - `cheerio`: Phân tích cú pháp HTML và trích xuất dữ liệu web.
    - `tsx`: Chạy trực tiếp file TypeScript nhanh chóng.

## 📋 Yêu cầu hệ thống

- Node.js (phiên bản 18 trở lên)
- API Key từ Anthropic (Claude)

## ⚙️ Cài đặt

1. **Clone project hoặc tải mã nguồn về máy.**
2. **Cài đặt các thư viện phụ thuộc:**
   ```bash
   npm install
   ```
3. **Cấu hình biến môi trường:**
   Tạo file `.env` ở thư mục gốc và thêm API Key của bạn:
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## 🖥️ Cách chạy ứng dụng

Sử dụng `tsx` để chạy ứng dụng:

```bash
npx tsx src/agent.ts
```

## 📖 Cấu trúc mã nguồn

- `src/agent.ts`: Chứa toàn bộ logic chính của Agent bao gồm khởi tạo client, định nghĩa công cụ, xử lý hội thoại và streaming.
- `sample.txt`: File văn bản mẫu dùng để thử nghiệm tính năng đọc file.
- `.env`: Lưu trữ thông tin nhạy cảm như API Key.

## 📝 Kịch bản Demo

Mặc định khi chạy, ứng dụng sẽ giả lập kịch bản người dùng yêu cầu:
1. Thực hiện phép tính `255 / 5`.
2. Đọc nội dung file `sample.txt`.
3. Kiểm tra khả năng nhớ của AI về kết quả phép tính ban đầu.
4. Truy cập trang web `make-everything-ok.com` và tóm tắt nội dung.

---
*Đây là project demo cho Training week 2*
