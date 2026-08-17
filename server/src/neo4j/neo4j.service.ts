import { Injectable, Logger, OnApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';
import neo4j, { Driver, Session, SessionMode } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver | null = null;
  private isConnected = false;

  constructor() {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      this.logger.warn('Neo4j credentials not found in environment variables. Adaptive engine will be disabled.');
      return;
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    } catch (error) {
      this.logger.error('Failed to initialize Neo4j driver', error);
    }
  }

  async onApplicationBootstrap() {
    if (!this.driver) return;

    try {
      await this.driver.verifyConnectivity();
      this.isConnected = true;
      this.logger.log(`Successfully connected to Neo4j database: ${process.env.NEO4J_DATABASE || 'default'}`);
    } catch (error) {
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

  getDriver(): Driver | null {
    return this.driver;
  }

  isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Executes a write query (e.g., CREATE, MERGE, SET, DELETE)
   */
  async write(cypher: string, params?: Record<string, any>) {
    if (!this.driver || !this.isConnected) {
      throw new Error('Neo4j is not connected');
    }
    
    const session = this.driver.session({ 
      database: process.env.NEO4J_DATABASE || 'neo4j',
      defaultAccessMode: neo4j.session.WRITE 
    });
    
    try {
      const result = await session.run(cypher, params);
      return result;
    } finally {
      await session.close();
    }
  }

  /**
   * Executes a read-only query (e.g., MATCH, RETURN)
   */
  async read(cypher: string, params?: Record<string, any>) {
    if (!this.driver || !this.isConnected) {
      throw new Error('Neo4j is not connected');
    }

    const session = this.driver.session({ 
      database: process.env.NEO4J_DATABASE || 'neo4j',
      defaultAccessMode: neo4j.session.READ 
    });
    
    try {
      const result = await session.run(cypher, params);
      return result;
    } finally {
      await session.close();
    }
  }
}
