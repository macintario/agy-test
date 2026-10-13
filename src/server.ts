import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './lib/prisma';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

async function main() {
  app.listen(port, () => {
    console.log(`Celex Grades API listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
