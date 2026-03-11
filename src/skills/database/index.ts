import * as crypto from 'crypto';
import { getK8sClient, SealosK8sClient } from '../../core/k8s-client';
import { CreateDatabaseParams, DatabaseConnectionInfo, SkillResult } from '../../core/types';
import { validateDatabaseParams } from '../../utils/validator';
import { getMongoDBClusterSpec } from './mongodb';
import { getMySQLClusterSpec } from './mysql';
import { getPostgreSQLClusterSpec } from './postgresql';
import { getRedisClusterSpec } from './redis';

const DB_CRD_GROUP = 'apps.kubeblocks.io';
const DB_CRD_VERSION = 'v1alpha1';
const DB_CRD_PLURAL = 'clusters';

export function buildConnectionString(type: CreateDatabaseParams['type'], host: string, port: number, password: string): string {
  switch (type) {
    case 'mysql':
      return `mysql://root:${password}@${host}:${port}`;
    case 'postgresql':
      return `postgresql://root:${password}@${host}:${port}/postgres`;
    case 'mongodb':
      return `mongodb://root:${password}@${host}:${port}`;
    case 'redis':
      return `redis://:${password}@${host}:${port}`;
  }
}

export async function createDatabase(params: CreateDatabaseParams, externalClient?: SealosK8sClient): Promise<SkillResult> {
  try {
    validateDatabaseParams(params);
  } catch (error) {
    return {
      success: false,
      message: `❌ 参数校验失败: ${(error as Error).message}`,
    };
  }

  const client = externalClient ?? getK8sClient();
  const namespace = client.getNamespace();
  const password = crypto.randomBytes(16).toString('hex');

  let clusterSpec: Record<string, unknown>;
  let defaultPort: number;

  switch (params.type) {
    case 'mysql':
      clusterSpec = getMySQLClusterSpec(params, namespace, password);
      defaultPort = 3306;
      break;
    case 'postgresql':
      clusterSpec = getPostgreSQLClusterSpec(params, namespace, password);
      defaultPort = 5432;
      break;
    case 'mongodb':
      clusterSpec = getMongoDBClusterSpec(params, namespace, password);
      defaultPort = 27017;
      break;
    case 'redis':
      clusterSpec = getRedisClusterSpec(params, namespace, password);
      defaultPort = 6379;
      break;
  }

  try {
    await client.customObjects.createNamespacedCustomObject(
      DB_CRD_GROUP,
      DB_CRD_VERSION,
      namespace,
      DB_CRD_PLURAL,
      clusterSpec,
    );

    const host = `${params.name}.${namespace}.svc.cluster.local`;
    const connectionInfo: DatabaseConnectionInfo = {
      host,
      port: defaultPort,
      username: params.type === 'redis' ? '' : 'root',
      password,
      database: params.type === 'postgresql' ? 'postgres' : undefined,
      connectionString: buildConnectionString(params.type, host, defaultPort, password),
    };

    return {
      success: true,
      message: [
        `✅ ${params.type.toUpperCase()} 数据库 "${params.name}" 创建成功！`,
        '',
        '📋 **连接信息**:',
        `  Host:     ${connectionInfo.host}`,
        `  Port:     ${connectionInfo.port}`,
        connectionInfo.username ? `  Username: ${connectionInfo.username}` : '',
        connectionInfo.database ? `  Database: ${connectionInfo.database}` : '',
        `  Password: ${connectionInfo.password}`,
        '',
        '🔗 **连接字符串**:',
        `  ${connectionInfo.connectionString}`,
        '',
        '⏳ 数据库创建中，请稍等 1-3 分钟后即可连接。',
      ].filter(Boolean).join('\n'),
      data: {
        connectionInfo,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ 创建 ${params.type} 数据库失败: ${(error as Error).message}`,
    };
  }
}