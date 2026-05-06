import * as dotenv from 'dotenv';
import * as path from 'path';
import * as cheerio from 'cheerio'; // thư viện dùng để phân tích cú pháp HTML và loại bỏ rác ở website

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

// 1. Khởi tạo Client (Tự động lấy API key từ file .env)
const client = new Anthropic();

// 2. Mảng lưu trữ hội thoại (Bộ nhớ Multi-turn)
let messages: Anthropic.MessageParam[] = [];

// 3. Tools Schema
const tools: Anthropic.Tool[] = [
    {
        name: "calculator",
        description: "Thực hiện các phép tính toán học cơ bản (cộng, trừ, nhân, chia).",
        input_schema: {
            type: "object",
            properties: {
                operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
                a: { type: "number" },
                b: { type: "number" }
            },
            required: ["operation", "a", "b"]
        }
    },
    {
        name: "file_reader",
        description: "Đọc nội dung của một file văn bản (.txt, .md, .json) từ hệ thống.",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Đường dẫn file cần đọc" }
            },
            required: ["path"]
        }
    },
    {
        name: "web_fetcher",
        description: "Lấy nội dung văn bản từ một địa chỉ URL (giả lập).",
        input_schema: {
            type: "object",
            properties: {
                url: { type: "string", description: "URL trang web" }
            },
            required: ["url"]
        }
    }
];

// 4. Code thực thi công việc
async function executeTool(name: string, input: any) {
    try {
        switch (name) {
            case "calculator":
                const { operation, a, b } = input;
                if (operation === "divide" && b === 0) throw new Error("Không thể chia cho 0!");

                if (operation === "add") return (a + b).toString();
                if (operation === "subtract") return (a - b).toString();
                if (operation === "multiply") return (a * b).toString();
                if (operation === "divide") return (a / b).toString();
                break;

            case "file_reader":
                return fs.readFileSync(input.path, 'utf-8');

            case "web_fetcher":
                console.log(`\n🌐 [Đang tải dữ liệu thực tế từ: ${input.url} ...]`);

                // 1. Tải toàn bộ mã HTML của trang web
                const response = await fetch(input.url);
                if (!response.ok) {
                    throw new Error(`Không thể truy cập trang web. Mã lỗi HTTP: ${response.status}`);
                }
                const html = await response.text();

                // 2. Dùng cheerio để phân tích mã HTML
                const $ = cheerio.load(html);

                // 3. Xóa bỏ các phần tử gây nhiễu, không chứa nội dung có ích
                $('script, style, noscript, iframe, img, svg, nav, footer').remove();

                // 4. Lấy toàn bộ chữ (text) còn lại trong thẻ <body> và dọn dẹp khoảng trắng thừa
                const cleanText = $('body').text().replace(/\s+/g, ' ').trim();

                // 5. Cắt bớt nội dung nếu quá dài (Tránh tràn bộ nhớ AI, ở đây lấy 15.000 ký tự đầu)
                const finalText = cleanText.substring(0, 15000);

                if (!finalText) {
                    return "Lỗi: Đã tải được trang nhưng không tìm thấy nội dung văn bản nào.";
                }

                return `Dưới đây là nội dung trang web: \n\n${finalText}`;
            default:
                throw new Error(`Công cụ ${name} không tồn tại.`);
        }
    } catch (error: any) {
        // Trả lỗi dạng string có chữ "Lỗi:" để AI nhận dạng và tự sửa
        return `Lỗi: ${error.message}`;
    }
}

// 5. Luồng xử lý Chat với AI
async function chat(userInput: string) {
    // Thêm tin nhắn của User vào bộ nhớ (nếu có nội dung)
    if (userInput) {
        messages.push({ role: "user", content: userInput });
        console.log(`\n👨‍💻 Bạn: ${userInput}`);
    }

    console.log("🤖 Agent đang suy nghĩ...\n");

    // Gửi request kèm Streaming và danh sách Tools
    const stream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        tools: tools,
        messages: messages,
    });

    let toolCall: any = null;

    stream.on('text', (text) => {
        process.stdout.write(text);
    });

    stream.on('contentBlock', (contentBlock) => {
        if (contentBlock.type === 'tool_use') {
            toolCall = contentBlock;
            console.log(`\n\n⚙️  [Hệ thống: AI đang kích hoạt công cụ '${contentBlock.name}'...]`);
        }
    });

    // Chờ AI nói xong và lưu câu trả lời vào bộ nhớ
    const finalMessage = await stream.finalMessage();
    messages.push({ role: "assistant", content: finalMessage.content });

    // 6. Xử lý sau khi AI gọi Tool
    if (toolCall) {
        const result = await executeTool(toolCall.name, toolCall.input);

        // Đóng gói kết quả gửi ngược lại cho AI
        messages.push({
            role: "user",
            content: [
                {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: String(result),
                    is_error: String(result).startsWith("Lỗi")
                }
            ]
        });

        await chat("");
    } else {
        console.log("\n");
    }
}

// 7. Hàm giả lập người dùng hỏi Multi-turn
async function runDemo() {
    await chat("Chào bạn, tôi đang có một phép tính khó: 255 chia cho 5 bằng bao nhiêu?");
    await chat("Tuyệt vời! Bây giờ hãy dùng khả năng đọc hệ thống của bạn để đọc file 'sample.txt' nhé.");
    await chat("Bạn còn nhớ đáp án ở phép tính bạn vừa làm ban đầu không?")
    await chat("hãy vào trang web https://make-everything-ok.com/ và tóm tắt nội dung chính của trang này cho tôi")
}

runDemo();