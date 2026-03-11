"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/core/k8s-client', () => ({
    getK8sClient: jest.fn(),
}));
jest.mock('../src/skills/deploy/deployment', () => ({
    createDeployment: jest.fn(),
}));
jest.mock('../src/skills/deploy/service', () => ({
    createService: jest.fn(),
}));
jest.mock('../src/skills/deploy/ingress', () => ({
    createIngress: jest.fn(),
}));
const k8s_client_1 = require("../src/core/k8s-client");
const deploy_1 = require("../src/skills/deploy");
const deployment_1 = require("../src/skills/deploy/deployment");
const ingress_1 = require("../src/skills/deploy/ingress");
const service_1 = require("../src/skills/deploy/service");
describe('deployContainer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(k8s_client_1.getK8sClient).mockReturnValue({
            getNamespace: () => 'demo',
        });
        jest.mocked(deployment_1.createDeployment).mockResolvedValue({ metadata: { name: 'demo-app' } });
        jest.mocked(service_1.createService).mockResolvedValue({
            metadata: { name: 'demo-app-svc' },
            spec: { clusterIP: '10.0.0.8' },
        });
        jest.mocked(ingress_1.createIngress).mockResolvedValue({ metadata: { name: 'demo-app-ingress' } });
    });
    it('creates deployment, service, and ingress', async () => {
        const result = await (0, deploy_1.deployContainer)({
            name: 'demo-app',
            image: 'nginx:latest',
            port: 80,
            enableIngress: true,
            domain: 'demo.example.com',
        });
        expect(result.success).toBe(true);
        expect(deployment_1.createDeployment).toHaveBeenCalled();
        expect(service_1.createService).toHaveBeenCalled();
        expect(ingress_1.createIngress).toHaveBeenCalled();
    });
    it('returns validation error when ingress domain is missing', async () => {
        const result = await (0, deploy_1.deployContainer)({
            name: 'demo-app',
            image: 'nginx:latest',
            port: 80,
            enableIngress: true,
        });
        expect(result.success).toBe(false);
        expect(result.message).toContain('参数校验失败');
    });
});
