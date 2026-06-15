const { PrismaClient } = require('../src/generated/prisma/client');
const p = new PrismaClient();

async function main() {
  const deleted = await p.item.deleteMany({});
  console.log('Deleted items:', deleted.count);
  const remaining = await p.dailyItem.count();
  console.log('Remaining dailyItems:', remaining);
}

main().finally(() => p.$disconnect());
