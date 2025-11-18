'use client';

import { useState } from 'react';
import WizardForm from './components/WizardForm';
import OutputDisplay from './components/OutputDisplay';

export default function Home() {
  const [generatedFiles, setGeneratedFiles] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (formData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate pipeline configurations');
      }

      const data = await response.json();
      setGeneratedFiles(data.files);
    } catch (error) {
      console.error('Error generating pipelines:', error);
      alert('Failed to generate pipeline configurations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 CI/CD Pipeline Wizard
          </h1>
          <p className="text-lg text-gray-600">
            Generate production-ready CI/CD configurations with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <WizardForm onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
          <div>
            <OutputDisplay files={generatedFiles} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
