import { useRef } from 'react';
import Image from 'next/image';

interface UploadSectionProps {
  selectedFiles: File[];
  uploading: boolean;
  showUploadPreview: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onUpload: () => void;
  formatFileSize: (bytes: number) => string;
}

export default function UploadSection({
  selectedFiles,
  uploading,
  showUploadPreview,
  onFileSelect,
  onRemoveFile,
  onClearAll,
  onUpload,
  formatFileSize
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-white/50 p-6">
    <div className="flex items-center justify-evenly gap-4">  
      <div className="hidden md:block">
        <Image src="/upload.svg" alt="Upload Icon" width={300} height={300} />
      </div>
      
        <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'linear-gradient(135deg, rgb(231, 86, 80) 0%, rgb(239, 250, 248) 100%)' }}>
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select File</h3>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            Choose files from your device to upload. You can select multiple files at once.
          </p>
          <p className='text-brand-primary font-semibold'>PDF, Images, CSV, etc.</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-8 py-3 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, rgb(231, 86, 80) 0%, rgb(239, 250, 248) 100%)' }}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload File
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={onFileSelect}
          className="hidden"
        />
      </div>
      </div>

      {showUploadPreview && selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length})</h4>
            <button
              onClick={onClearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="shrink-0 ml-2 text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={onUpload}
            disabled={uploading}
            className="w-full px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgb(231, 86, 80)' }}
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
