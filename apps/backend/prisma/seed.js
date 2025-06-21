const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.sfuServer.createMany({
    data: [
      { id: 'def', name: 'Frankfurt (fast)', url: 'ws://46.101.161.133:7880' },
      { id: 'local', name: 'Belarus (slow)', url: 'ws://93.170.236.80:7880' },
      { id: 'eu', name: 'Central Europe (fast)', url: 'ws://109.199.112.148:7880' },
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