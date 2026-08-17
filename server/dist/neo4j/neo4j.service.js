"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Neo4jService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
let Neo4jService = Neo4jService_1 = class Neo4jService {
    logger = new common_1.Logger(Neo4jService_1.name);
    driver = null;
    isConnected = false;
    constructor() {
        const uri = process.env.NEO4J_URI;
        const username = process.env.NEO4J_USERNAME;
        const password = process.env.NEO4J_PASSWORD;
        if (!uri || !username || !password) {
            this.logger.warn('Neo4j credentials not found in environment variables. Adaptive engine will be disabled.');
            return;
        }
        try {
            this.driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(username, password));
        }
        catch (error) {
            this.logger.error('Failed to initialize Neo4j driver', error);
        }
    }
    async onApplicationBootstrap() {
        if (!this.driver)
            return;
        try {
            await this.driver.verifyConnectivity();
            this.isConnected = true;
            this.logger.log(`Successfully connected to Neo4j database: ${process.env.NEO4J_DATABASE || 'default'}`);
        }
        catch (error) {
            this.logger.error('Failed to verify Neo4j connectivity', error);
            this.isConnected = false;
        }
    }
    async onApplicationShutdown() {
        if (this.driver) {
            await this.driver.close();
            this.logger.log('Neo4j driver closed');
        }
    }
    getDriver() {
        return this.driver;
    }
    isDatabaseConnected() {
        return this.isConnected;
    }
    async write(cypher, params) {
        if (!this.driver || !this.isConnected) {
            throw new Error('Neo4j is not connected');
        }
        const session = this.driver.session({
            database: process.env.NEO4J_DATABASE || 'neo4j',
            defaultAccessMode: neo4j_driver_1.default.session.WRITE
        });
        try {
            const result = await session.run(cypher, params);
            return result;
        }
        finally {
            await session.close();
        }
    }
    async read(cypher, params) {
        if (!this.driver || !this.isConnected) {
            throw new Error('Neo4j is not connected');
        }
        const session = this.driver.session({
            database: process.env.NEO4J_DATABASE || 'neo4j',
            defaultAccessMode: neo4j_driver_1.default.session.READ
        });
        try {
            const result = await session.run(cypher, params);
            return result;
        }
        finally {
            await session.close();
        }
    }
};
exports.Neo4jService = Neo4jService;
exports.Neo4jService = Neo4jService = Neo4jService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], Neo4jService);
//# sourceMappingURL=neo4j.service.js.map