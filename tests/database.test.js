"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/core/k8s-client', () => ({
    getK8sClient: jest.fn(),
}));
jest.mock('crypto', () => {
    const actual = jest.requireActual('crypto');
    return {
        ...actual,
        randomBytes: jest.fn(() => Buffer.from('0123456789abcdef0123456789abcdef', 'hex')),
    };
});
const k8s_client_1 = require("../src/core/k8s-client");
const database_1 = require("../src/skills/database");
describe('createDatabase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(k8s_client_1.getK8sClient).mockReturnValue({
            getNamespace: () => 'tenant-a',
            customObjects: {
                createNamespacedCustomObject: jest.fn().mockResolvedValue({}),
            },
        });
    });
    it('creates a mysql cluster and returns connection info', async () => {
        const result = await (0, database_1.createDatabase)({
            name: 'orders-db',
            type: 'mysql',
            storageSize: '10Gi',
        });
        expect(result.success).toBe(true);
        expect(result.message).toContain('MYSQL 数据库');
        expect(result.message).toContain('orders-db.tenant-a.svc.cluster.local');
    });
    it('builds connection strings for redis', () => {
        expect((0, database_1.buildConnectionString)('redis', 'redis.demo', 6379, 'secret')).toBe('redis://:secret@redis.demo:6379');
    });
    it('returns validation error for invalid names', async () => {
        const result = await (0, database_1.createDatabase)({
            name: 'Bad_Name',
            type: 'postgresql',
        });
        expect(result.success).toBe(false);
        expect(result.message).toContain('参数校验失败');
    });
});
