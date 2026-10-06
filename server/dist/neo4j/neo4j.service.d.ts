import { OnApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
export declare class Neo4jService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger;
    private driver;
    private isConnected;
    constructor();
    onApplicationBootstrap(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
    getDriver(): Driver | null;
    isDatabaseConnected(): boolean;
    write(cypher: string, params?: Record<string, any>): Promise<import("neo4j-driver").QueryResult<import("neo4j-driver").RecordShape>>;
    read(cypher: string, params?: Record<string, any>): Promise<import("neo4j-driver").QueryResult<import("neo4j-driver").RecordShape>>;
}
