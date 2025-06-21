const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.sfuServer.createMany({
    data: [
      { id: 'def', name: 'Frankfurt (fast)', url: 'wss://de-shpion.pr0d.ru' },
      { id: 'local', name: 'Belarus (slow)', url: 'ws://93.170.236.80:7880' },
      { id: 'eu', name: 'Central Europe (fast)', url: 'wss://eu-shpion.pr0d.ru' },
    ],
    skipDuplicates: true,
  });
  console.log('✅  SFU presets seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 