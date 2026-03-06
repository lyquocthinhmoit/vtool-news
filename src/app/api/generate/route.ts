import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';

// Khởi tạo Gemini AI SDK mới
// API Key mặc định được lấy từ biến môi trường GEMINI_API_KEY
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({}) : null;

// Khai báo System Prompt chặt chẽ
const SYSTEM_INSTRUCTION = `Bạn là một Biên tập viên dày dạn kinh nghiệm, xuất sắc và chuẩn mực của Cổng Thông tin Điện tử Cục Công nghiệp, Bộ Công Thương Việt Nam.
Nhiệm vụ của bạn là viết một CÂU CHUYỆN BÁO CHÍ (BẢN TIN) HOÀN CHỈNH dựa THUẦN TÚY TRÊN NHỮNG DỮ KIỆN ĐƯỢC CUNG CẤP TRONG PROMPT (bao gồm văn bản nháp, nội dung file Word, hoặc mô tả từ hình ảnh).

Ràng buộc VÔ CÙNG QUAN TRỌNG:
1. KHÔNG ĐƯỢC BỊA ĐẶT, suy diễn phỏng đoán bất cứ số liệu, tên người, diễn biến thời gian hay sự kiện nào không có trong tài liệu đầu vào.
2. NẾU THIẾU THÔNG TIN ĐẾ MỨC KHÔNG THỂ VIẾT THÀNH BẢN TIN: Hãy dừng lại và phản hồi "Xin lỗi, dữ liệu cung cấp chưa đủ để tổng hợp thành một bản tin báo chí hoàn chỉnh. Vui lòng cung cấp thêm thông tin."
3. Văn phong: Khách quan, trang trọng, chuẩn mực hành chính - báo chí nhà nước. Sử dụng ngôn từ trong sáng, mạch lạc, dễ hiểu. Phải có Tiêu đề hay và Sapo (đoạn giới thiệu) tóm tắt được ý chính.
4. Trình bày: Gồm Tiêu đề (in đậm), Sapo (in nghiêng), Nội dung chi tiết (chia đoạn rõ ràng).
5. Nội dung không nên được lặp lại, giữ nguyên thứ tự của bài viết gốc hay file gốc mà nên sắp xếp lại một chút để tạo nên sự khác biệt.
6. Bài viết  có nội dung không quá 1000 từ.
7. Không nên sử dụng lặp thông tin đã sử dụng trong bài.
Hãy đọc tất cả dữ kiện dưới đây, sắp xếp lại theo bố cục hợp lý và thực hiện việc biên tập thật xuất sắc.`;

export async function POST(req: Request) {
  try {
    if (!ai) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống máy chủ.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const textDesc = formData.get('text') as string | null;
    const wordFile = formData.get('wordDocument') as File | null;
    const images = formData.getAll('images') as File[];

    let wordContent = '';

    // 1. Trích xuất Text từ file Word (nếu có)
    if (wordFile) {
      const arrayBuffer = await wordFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      try {
        const result = await mammoth.extractRawText({ buffer });
        wordContent = result.value;
      } catch (err) {
        console.error('Mammoth extract error:', err);
        return NextResponse.json(
          { error: 'Không thể đọc được nội dung từ file Word cung cấp. Vui lòng kiểm tra lại file.' },
          { status: 400 }
        );
      }
    }

    if (!textDesc && !wordContent && images.length === 0) {
      return NextResponse.json(
        { error: 'Không có thông tin đầu vào để biên tập.' },
        { status: 400 }
      );
    }

    // 2. Gom dữ liệu Prompt
    const contents: any[] = [];
    
    // Gom nội dung chữ
    let combinedTextContent = '';
    if (textDesc && textDesc.trim() !== '') {
      combinedTextContent += `--- VĂN BẢN GHI CHÚ / TÓM TẮT SỰ KIỆN ---\n${textDesc}\n\n`;
    }
    if (wordContent && wordContent.trim() !== '') {
      combinedTextContent += `--- NỘI DUNG TÀI LIỆU WORD TRÍCH XUẤT ---\n${wordContent}\n\n`;
    }

    if (combinedTextContent) {
       contents.push(combinedTextContent);
    }

    // Gom hình ảnh
    for (const img of images) {
      const buffer = await img.arrayBuffer();
      contents.push({
        inlineData: {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: img.type,
        },
      });
    }

    // Lệnh yêu cầu cho AI
    contents.push("\nDựa vào tất cả những thông tin/hình ảnh kể trên, hãy viết bản tin theo đúng chỉ thị.");

    // 3. Gọi Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Nhiệt độ thấp để giảm tính sáng tạo/bịa đặt
      },
    });

    const article = response.text;

    return NextResponse.json({ article });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}
