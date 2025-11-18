'use client';

import { useState } from 'react';

interface FileOutput {
  path: string;
  content: string;
}

interface OutputDisplayProps {
  files: FileOutput[] | null;
  isLoading: boolean;
}

export default function OutputDisplay({ files, isLoading }: OutputDisplayProps) {
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (files && files[selectedFile]) {
      await navigator.clipboard.writeText(files[selectedFile].content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (files && files[selectedFile]) {
      const file = files[selectedFile];
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.path.split('/').pop() || 'config.yml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating your pipeline configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-gray-500">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">No files generated yet</p>
            <p className="text-sm mt-2">
              Fill out the form and click &quot;Generate&quot; to create your pipeline configs
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Generated Files</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200 text-sm font-medium"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button
            onClick={downloadFile}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 text-sm font-medium"
          >
            Download
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
        {files.map((file, index) => (
          <button
            key={index}
            onClick={() => setSelectedFile(index)}
            className={`px-4 py-2 text-sm font-medium transition duration-200 border-b-2 ${
              selectedFile === index
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {file.path}
          </button>
        ))}
      </div>

      {/* File Content */}
      <div className="bg-gray-900 rounded-lg p-6 overflow-auto max-h-[600px]">
        <pre className="text-sm text-gray-100 font-mono">
          <code>{files[selectedFile].content}</code>
        </pre>
      </div>

      {/* File Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          File: <span className="font-medium">{files[selectedFile].path}</span>
        </p>
        <p>
          Size: <span className="font-medium">{files[selectedFile].content.length} bytes</span>
        </p>
      </div>
    </div>
  );
}
