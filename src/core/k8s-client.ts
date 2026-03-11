import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const SEALOS_KUBECONFIG_PATH = path.join(os.homedir(), '.kube', 'sealos', 'config');

export class SealosK8sClient {
  private readonly kc: k8s.KubeConfig;
  private readonly appsApi: k8s.AppsV1Api;
  private readonly coreApi: k8s.CoreV1Api;
  private readonly networkingApi: k8s.NetworkingV1Api;
  private readonly customObjectsApi: k8s.CustomObjectsApi;

  constructor(options?: { kubeconfigPath?: string; kubeconfigString?: string }) {
    this.kc = new k8s.KubeConfig();

    if (options?.kubeconfigString) {
      // Load directly from an in-memory string (e.g. stored in DB)
      this.kc.loadFromString(options.kubeconfigString);
    } else {
      const kubePath = options?.kubeconfigPath ?? SEALOS_KUBECONFIG_PATH;
      if (!fs.existsSync(kubePath)) {
        throw new Error(`Sealos kubeconfig not found at ${kubePath}. Run the init skill first.`);
      }
      this.kc.loadFromFile(kubePath);
    }

    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
  }

  getNamespace(): string {
    const currentContext = this.kc.getCurrentContext();
    const context = this.kc.getContextObject(currentContext);
    return context?.namespace || 'default';
  }

  get apps(): k8s.AppsV1Api {
    return this.appsApi;
  }

  get core(): k8s.CoreV1Api {
    return this.coreApi;
  }

  get networking(): k8s.NetworkingV1Api {
    return this.networkingApi;
  }

  get customObjects(): k8s.CustomObjectsApi {
    return this.customObjectsApi;
  }

  get kubeConfig(): k8s.KubeConfig {
    return this.kc;
  }
}

let singletonClient: SealosK8sClient | null = null;

/** Get a global singleton client (reads from default file path). */
export function getK8sClient(): SealosK8sClient {
  if (!singletonClient) {
    singletonClient = new SealosK8sClient();
  }

  return singletonClient;
}

/** Create a one-off client from an in-memory kubeconfig string. */
export function createK8sClientFromString(kubeconfigString: string): SealosK8sClient {
  return new SealosK8sClient({ kubeconfigString });
}

export function resetK8sClientForTests(): void {
  singletonClient = null;
}