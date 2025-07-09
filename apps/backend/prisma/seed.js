const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const presets = [
    { id: 'de', name: 'Germany (Frankfurt)', url: 'wss://de-shpion.pr0d.ru/' },
    { id: 'eu', name: 'Local (EU)', url: 'wss://eu-shpion.pr0d.ru/' },
  ];

  await Promise.all(
    presets.map((preset) =>
      prisma.sfuServer.upsert({
        where: { id: preset.id },
        create: preset,
        update: { name: preset.name, url: preset.url },
      })
    )
  );
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