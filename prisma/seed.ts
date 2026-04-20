import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as Parameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Seeding database...");

  const [calvinPwd, laurenPwd, ceoPwd] = await Promise.all([
    bcrypt.hash("calvin2024!", 12),
    bcrypt.hash("lauren2024!", 12),
    bcrypt.hash("assetceo2024!", 12),
  ]);

  const calvin = await prisma.user.upsert({
    where: { email: "calvinling@moleculecapital.net" },
    update: {},
    create: { email: "calvinling@moleculecapital.net", name: "Calvin Ling", password: calvinPwd, role: "PRINCIPAL" },
  });

  await prisma.user.upsert({
    where: { email: "lauren@moleculecapital.com" },
    update: {},
    create: { email: "lauren@moleculecapital.com", name: "Lauren", password: laurenPwd, role: "OPS" },
  });

  await prisma.user.upsert({
    where: { email: "ceo@assetcompany.com" },
    update: {},
    create: { email: "ceo@assetcompany.com", name: "Asset CEO", password: ceoPwd, role: "ASSET_CEO" },
  });

  await prisma.deal.upsert({
    where: { id: "seed-deal-1" },
    update: {},
    create: {
      id: "seed-deal-1",
      name: "Core AI (CHAI) Reverse Merger",
      status: "ACTIVE",
      sector: "AI / Mobile Gaming",
      stage: "Post-Closing",
      description: "Core Gaming reverse merger. F-3 registration and restricted share unlock in progress.",
      ownerId: calvin.id,
    },
  });

  const providers = [
    { id: "sp-uhy", name: "UHY LLP", type: "AUDITOR", contact: "Ro Sokhi", rating: 4.5, notes: "PCAOB-registered. Preferred for domestic companies." },
    { id: "sp-audit-alliance", name: "Audit Alliance (Singapore)", type: "AUDITOR", rating: 4.0, notes: "PCAOB-registered. Preferred for Asia-origin companies." },
    { id: "sp-fundcertify", name: "FundCertify", type: "AUDITOR", contact: "Tony Chan", rating: 4.0, notes: "Alternative PCAOB-registered auditor." },
    { id: "sp-maxim", name: "Maxim Group", type: "IR_FIRM", rating: 4.0, notes: "ATM facility. LSH ATM LOE under review." },
    { id: "sp-hcw", name: "HCW Securities", type: "IR_FIRM", notes: "Pending healthcare-focused engagement." },
    { id: "sp-vstock", name: "VStock Transfer", type: "TRANSFER_AGENT", notes: "Requires issuance letters for each conversion. DRS transfer processing." },
    { id: "sp-mcdermott", name: "McDermott Corporate Services LLC", type: "LAW_FIRM", notes: "Delaware registered agent." },
  ];
  for (const p of providers) {
    await prisma.serviceProvider.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  console.log("✓ Users: calvinling@moleculecapital.net / lauren@moleculecapital.com / ceo@assetcompany.com");
  console.log("✓ Deals and service providers seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
