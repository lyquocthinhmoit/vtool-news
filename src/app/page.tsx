'use client';

import { useState, useRef } from 'react';
import { FileText, Image as ImageIcon, Upload, FileUp, Send, Loader2, FileCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [textInput, setTextInput] = useState('');
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const wordInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleWordUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWordFile(e.target.files[0]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 5); // Max 5 images
      setImageFiles((prev) => [...prev, ...filesArray].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!textInput.trim() && !wordFile && imageFiles.length === 0) {
      setErrorMsg('Vui lòng cung cấp ít nhất một dữ liệu đầu vào (văn bản, file word hoặc hình ảnh).');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);
    setResult('');

    try {
      const formData = new FormData();
      formData.append('text', textInput);
      if (wordFile) {
        formData.append('wordDocument', wordFile);
      }
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra trong quá trình tạo bản tin.');
      }

      setResult(data.article);
    } catch (error: any) {
      setErrorMsg(error.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              <FileCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Hệ thống Biên tập Tự động
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Cục Công nghiệp - Bộ Công Thương
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Hướng dẫn sử dụng
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Cung cấp các tài liệu đầu vào (bản thảo, báo cáo Word, hình ảnh sự kiện). Trí tuệ Nhân tạo sẽ tổng hợp và tự động soạn thảo một bản tin báo chí chuẩn mực, khách quan dựa trên dữ kiện có thật.
            </p>
            
            {/* Text Input */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <FileText className="w-4 h-4 text-blue-600" />
                Văn bản tóm tắt / Ghi chú (tùy chọn)
              </label>
              <textarea
                className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                placeholder="Dán nội dung tóm tắt sự kiện hoặc ghi chú thêm vào đây..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>

            {/* Word Upload */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <FileUp className="w-4 h-4 text-blue-600" />
                Tài liệu Word (.docx)
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${wordFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                onClick={() => wordInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={wordInputRef} 
                  accept=".docx" 
                  className="hidden" 
                  onChange={handleWordUpload}
                />
                {wordFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="truncate max-w-[200px]">{wordFile.name}</span>
                    <button 
                      className="ml-2 text-xs text-red-500 hover:underline"
                      onClick={(e) => { e.stopPropagation(); setWordFile(null); }}
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span>Nhấn để chọn file báo cáo Word</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Hình ảnh minh họa (Tối đa 5)
              </label>
              <input 
                type="file" 
                ref={imageInputRef} 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={handleImageUpload}
              />
              <div className="flex gap-3 flex-wrap">
                {imageFiles.map((file, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-md overflow-hidden border border-slate-200">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="w-20 h-20 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-colors"
                  >
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Thêm ảnh</span>
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang phân tích và xử lý...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Bắt đầu Viết Bản Tin
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Kết quả Bản tin</h2>
            </div>
            <div className="p-6 flex-1 overflow-auto bg-white min-h-[500px]">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="animate-pulse font-medium">Đang tổng hợp dữ kiện và soạn thảo...</p>
                </div>
              ) : result ? (
                <div className="prose prose-slate prose-blue max-w-none">
                  {/* Tạm thời render plain text có xuống dòng, sau này tích hợp markdown parser nếu cần */}
                  <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-[1.05rem]">
                    {result}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-8">
                  <div className="w-24 h-24 mb-4 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                    <FileCheck className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-base font-medium text-slate-600 mb-2">Chưa có bản tin nào được tạo</p>
                  <p className="text-sm">Hãy tải lên các tài liệu ở cột bên trái và nhấn "Bắt đầu Viết Bản Tin" để Trí tuệ Nhân tạo thực hiện công việc.</p>
                </div>
              )}
            </div>
            {result && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                 <button 
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Sao chép bản tin
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
