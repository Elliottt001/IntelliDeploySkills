"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const loadFromString = jest.fn();
const loadFromFile = jest.fn();
const getClusters = jest.fn();
const getContexts = jest.fn();
const listNamespace = jest.fn();
const makeApiClient = jest.fn();
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn().mockReturnValue(undefined),
    writeFileSync: jest.fn().mockReturnValue(undefined),
}));
jest.mock('@kubernetes/client-node', () => ({
    KubeConfig: jest.fn().mockImplementation(() => ({
        loadFromString,
        loadFromFile,
        getClusters,
        getContexts,
        makeApiClient,
    })),
    CoreV1Api: function CoreV1Api() { },
}));
const fs = __importStar(require("fs"));
const init_1 = require("../src/skills/init");
describe('initSkill', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getClusters.mockReturnValue([{}]);
        getContexts.mockReturnValue([{}]);
        makeApiClient.mockReturnValue({ listNamespace });
        listNamespace.mockResolvedValue({});
    });
    it('returns existing kubeconfig path when config already exists', async () => {
        jest.mocked(fs.existsSync).mockReturnValue(true);
        const result = await (0, init_1.initSkill)();
        expect(result.success).toBe(true);
        expect(result.kubeconfigPath).toBe(init_1.SEALOS_KUBECONFIG_PATH);
    });
    it('returns validation error for invalid kubeconfig content', async () => {
        jest.mocked(fs.existsSync).mockReturnValue(false);
        loadFromString.mockImplementation(() => {
            throw new Error('bad config');
        });
        const result = await (0, init_1.initSkill)('invalid');
        expect(result.success).toBe(false);
        expect(result.message).toContain('kubeconfig 格式验证失败');
    });
    it('writes kubeconfig and validates connection', async () => {
        jest.mocked(fs.existsSync).mockReturnValue(false);
        loadFromString.mockClear();
        loadFromString.mockImplementation(() => { }); // Reset the error mock from the previous test
        getClusters.mockReturnValue([{ name: 'cluster1', server: 'https://example.com' }]);
        getContexts.mockReturnValue([{ name: 'ctx1', cluster: 'cluster1' }]);
        const result = await (0, init_1.initSkill)('apiVersion: v1');
        expect(result.success).toBe(true);
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalledWith(init_1.SEALOS_KUBECONFIG_PATH, 'apiVersion: v1', { mode: 0o600 });
        expect(listNamespace).toHaveBeenCalled();
    });
});
