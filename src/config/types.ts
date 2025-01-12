export interface ComfyUIWorkflow {
  id: string;
  name: string;
  description: string;
  model: string;
  version: string;
  workflow: Record<string, any>;
}

export interface AIRouteConfig {
  workflows: {
    [key: string]: ComfyUIWorkflow;
  };
  defaultWorkflow: string;
  replicateVersions: {
    [key: string]: string;
  };
}
