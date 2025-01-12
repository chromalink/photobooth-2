'use client';

import { useState } from 'react';
import { AI_ROUTE_CONFIGS, getComfyUIWorkflows } from '../../config/ai-route-config';

export default function AdminPage() {
  const [selectedProvider, setSelectedProvider] = useState('comfyui');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [showWorkflowJson, setShowWorkflowJson] = useState(false);
  
  const providers = Object.keys(AI_ROUTE_CONFIGS);
  const selectedConfig = AI_ROUTE_CONFIGS[selectedProvider];
  const comfyUIWorkflows = selectedProvider === 'comfyui' ? getComfyUIWorkflows() : null;

  // Set initial selected workflow
  if (comfyUIWorkflows && !selectedWorkflow) {
    setSelectedWorkflow(comfyUIWorkflows.defaultWorkflow);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-12 text-gray-800">AI Configuration Admin</h1>
      
      {/* Provider Selection */}
      <div className="mb-12 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">AI Provider</h2>
        <select 
          value={selectedProvider}
          onChange={(e) => {
            setSelectedProvider(e.target.value);
            setSelectedWorkflow('');
            setShowWorkflowJson(false);
          }}
          className="w-full max-w-md p-3 text-lg border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {providers.map(provider => (
            <option key={provider} value={provider} className="text-lg">
              {AI_ROUTE_CONFIGS[provider].displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Provider Details */}
      <div className="mb-12 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">Provider Details</h2>
        <div className="space-y-4 text-lg">
          <p className="flex items-center">
            <span className="font-medium w-32">Provider:</span>
            <span>{selectedConfig.displayName}</span>
          </p>
          <p className="flex items-center">
            <span className="font-medium w-32">API Route:</span>
            <span>{selectedConfig.route}</span>
          </p>
          
          {/* Provider-specific configuration */}
          {selectedConfig.config.stability && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Stability AI Configuration</h3>
              <p className="flex items-center">
                <span className="font-medium w-32">API Host:</span>
                <span>{selectedConfig.config.stability.apiHost}</span>
              </p>
            </div>
          )}

          {selectedConfig.config.midjourneyDiscord && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Midjourney Discord Configuration</h3>
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="font-medium w-32">Server ID:</span>
                  <span>{selectedConfig.config.midjourneyDiscord.serverId}</span>
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-32">Channel ID:</span>
                  <span>{selectedConfig.config.midjourneyDiscord.channelId}</span>
                </p>
              </div>
            </div>
          )}

          {selectedConfig.config.comfyui && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">ComfyUI Configuration</h3>
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="font-medium w-32">Model Version:</span>
                  <span>{selectedConfig.config.comfyui.modelVersion}</span>
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-32">Default Workflow:</span>
                  <span>{selectedConfig.config.comfyui.defaultWorkflow}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ComfyUI Workflows */}
      {comfyUIWorkflows && (
        <div className="mb-12 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">Available Workflows</h2>
          
          {/* Workflow Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium mb-3 text-gray-700">Select Workflow</label>
            <select 
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="w-full max-w-md p-3 text-lg border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6"
            >
              {Object.values(comfyUIWorkflows.workflows).map((workflow) => (
                <option key={workflow.id} value={workflow.id} className="text-lg">
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workflow Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.values(comfyUIWorkflows.workflows).map((workflow) => (
              <div 
                key={workflow.id} 
                className={`bg-gray-50 p-6 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  workflow.id === selectedWorkflow ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedWorkflow(workflow.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{workflow.name}</h3>
                  {workflow.id === comfyUIWorkflows.defaultWorkflow && (
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-lg mb-4">{workflow.description}</p>
                <div className="space-y-2 text-base">
                  <p className="flex items-center">
                    <span className="font-medium w-24">ID:</span>
                    <span className="text-gray-600">{workflow.id}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium w-24">Model:</span>
                    <span className="text-gray-600">{workflow.model}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium w-24">Version:</span>
                    <span className="text-gray-600">{workflow.version}</span>
                  </p>
                  
                  {/* Toggle Workflow JSON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWorkflowJson(prev => workflow.id === selectedWorkflow ? !prev : true);
                      setSelectedWorkflow(workflow.id);
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-800 text-lg font-medium"
                  >
                    {showWorkflowJson && workflow.id === selectedWorkflow ? 'Hide JSON' : 'View JSON'}
                  </button>

                  {/* Workflow JSON */}
                  {showWorkflowJson && workflow.id === selectedWorkflow && (
                    <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm overflow-auto max-h-96 font-mono">
                      {JSON.stringify(workflow.workflow, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
