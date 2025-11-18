'use client';

import { useState } from 'react';

interface WizardFormProps {
  onGenerate: (data: any) => void;
  isLoading: boolean;
}

export default function WizardForm({ onGenerate, isLoading }: WizardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    framework: 'Next.js',
    language: 'TypeScript',
    usesDB: false,
    database: 'PostgreSQL',
    usesDocker: false,
    deployTargets: [] as string[],
    githubUrl: '',
  });

  const frameworks = [
    'Next.js',
    'NestJS',
    'Express',
    'Fastify',
    'React',
    'Vue.js',
    'Angular',
  ];

  const languages = ['TypeScript', 'JavaScript', 'Python', 'Go'];

  const databases = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const handleCheckboxChange = (target: string, checked: boolean) => {
    if (target === 'railway' || target === 'vercel') {
      const newTargets = checked
        ? [...formData.deployTargets, target]
        : formData.deployTargets.filter((t) => t !== target);
      setFormData({ ...formData, deployTargets: newTargets });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Project Configuration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-awesome-app"
          />
        </div>

        {/* Framework */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Framework *
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.framework}
            onChange={(e) =>
              setFormData({ ...formData, framework: e.target.value })
            }
          >
            {frameworks.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language *
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.language}
            onChange={(e) =>
              setFormData({ ...formData, language: e.target.value })
            }
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Database */}
        <div>
          <label className="flex items-center space-x-3 mb-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.usesDB}
              onChange={(e) =>
                setFormData({ ...formData, usesDB: e.target.checked })
              }
            />
            <span className="text-sm font-medium text-gray-700">
              Uses Database
            </span>
          </label>
          {formData.usesDB && (
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.database}
              onChange={(e) =>
                setFormData({ ...formData, database: e.target.value })
              }
            >
              {databases.map((db) => (
                <option key={db} value={db}>
                  {db}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Docker */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.usesDocker}
              onChange={(e) =>
                setFormData({ ...formData, usesDocker: e.target.checked })
              }
            />
            <span className="text-sm font-medium text-gray-700">
              Uses Docker
            </span>
          </label>
        </div>

        {/* Deploy Targets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Deploy Targets
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.deployTargets.includes('railway')}
                onChange={(e) => handleCheckboxChange('railway', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Railway</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.deployTargets.includes('vercel')}
                onChange={(e) => handleCheckboxChange('vercel', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Vercel</span>
            </label>
          </div>
        </div>

        {/* GitHub URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub URL (optional)
          </label>
          <input
            type="url"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.githubUrl}
            onChange={(e) =>
              setFormData({ ...formData, githubUrl: e.target.value })
            }
            placeholder="https://github.com/username/repo"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Pipeline Configs'}
        </button>
      </form>
    </div>
  );
}
