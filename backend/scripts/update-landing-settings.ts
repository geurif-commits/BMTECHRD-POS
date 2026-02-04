import prisma from '../src/config/database.js';

async function main() {
  const data = {
    landingBackgroundUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    contactName: 'BMTECHRD Soporte',
    contactEmail: 'soporte@bmtechrd.com',
    contactPhone: '+1 (809) 555-1234',
    contactWhatsapp: '+1 (809) 555-1234'
  };

  const existing = await (prisma as any).globalSetting.findFirst();
  if (existing) {
    await (prisma as any).globalSetting.update({
      where: { id: existing.id },
      data
    });
  } else {
    await (prisma as any).globalSetting.create({ data });
  }

  console.log('OK');
}

main()
  .catch((error) => {
    console.error('Error updating landing settings:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
