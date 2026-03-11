import { CreateDatabaseParams, DeployContainerParams, SkillResult } from './core/types';
import { SealosK8sClient, createK8sClientFromString } from './core/k8s-client';
import { createDatabase } from './skills/database';
import { deployContainer } from './skills/deploy';
import { initSkill } from './skills/init';

export class SealosSkills {
  private client?: SealosK8sClient;

  /** Create a SealosSkills instance optionally pre-bound to a kubeconfig string. */
  constructor(options?: { kubeconfigString?: string }) {
    if (options?.kubeconfigString) {
      this.client = createK8sClientFromString(options.kubeconfigString);
    }
  }

  async init(kubeconfigContent?: string): Promise<SkillResult> {
    return initSkill(kubeconfigContent);
  }

  async deploy(params: DeployContainerParams): Promise<SkillResult> {
    return deployContainer(params, this.client);
  }

  async createDB(params: CreateDatabaseParams): Promise<SkillResult> {
    return createDatabase(params, this.client);
  }
}

export { SealosK8sClient, createK8sClientFromString } from './core/k8s-client';
export { initSkill } from './skills/init';
export { deployContainer } from './skills/deploy';
export { createDatabase } from './skills/database';
export type {
  CreateDatabaseParams,
  DatabaseConnectionInfo,
  DeployContainerParams,
  InitResult,
  SkillResult,
} from './core/types';