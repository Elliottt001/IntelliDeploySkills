import { getK8sClient, SealosK8sClient } from '../../core/k8s-client';
import { DeployContainerParams, SkillResult } from '../../core/types';
import { validateDeployParams } from '../../utils/validator';
import { createDeployment } from './deployment';
import { createIngress } from './ingress';
import { createService } from './service';

export async function deployContainer(params: DeployContainerParams, externalClient?: SealosK8sClient): Promise<SkillResult> {
  try {
    validateDeployParams(params);
  } catch (error) {
    return {
      success: false,
      message: `❌ 参数校验失败: ${(error as Error).message}`,
    };
  }

  const client = externalClient ?? getK8sClient();
  const namespace = client.getNamespace();
  const results: string[] = [];

  try {
    const deployment = await createDeployment(client, namespace, params);
    results.push(`✅ Deployment "${deployment.metadata?.name}" 创建成功 (副本数: ${params.replicas || 1})`);

    const service = await createService(client, namespace, params);
    const clusterIP = service.spec?.clusterIP;
    results.push(`✅ Service "${service.metadata?.name}" 创建成功 (ClusterIP: ${clusterIP || 'pending'})`);

    if (params.enableIngress && params.domain) {
      const ingress = await createIngress(client, namespace, params);
      results.push(`✅ Ingress "${ingress.metadata?.name}" 创建成功 (域名: ${params.domain})`);
    }

    return {
      success: true,
      message: results.join('\n'),
      data: {
        namespace,
        deploymentName: params.name,
        serviceName: `${params.name}-svc`,
        clusterIP,
        domain: params.domain,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ 部署失败: ${(error as Error).message}\n\n已完成的步骤:\n${results.join('\n') || '无'}`,
    };
  }
}