const http = require('http');
// Need a valid JWT to check the API. I'll just check what the service method returns directly.
const { CertificatesService } = require('./src/certificates/certificates.service');
const { PrismaService } = require('./src/prisma/prisma.service');
const { Neo4jService } = require('./src/neo4j/neo4j.service');
const neo4j = require('neo4j-driver');

async function run() {
  const prisma = new PrismaService();
  const neo4jService = {
    read: async (query, params) => {
      const driver = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'Skyfall@007'));
      const session = driver.session();
      const result = await session.readTransaction(tx => tx.run(query, params));
      await session.close();
      await driver.close();
      return result;
    }
  };
  const svc = new CertificatesService(prisma, neo4jService);
  const result = await svc.checkEligibility(1, 3);
  console.log('Eligibility:', result);
}
run();
