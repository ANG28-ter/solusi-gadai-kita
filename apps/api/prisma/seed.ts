import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (debug version)...');

  const existingProfile = await prisma.companyProfile.findFirst();
  if (!existingProfile) {
    await prisma.companyProfile.create({
      data: {
        name: 'PT Solusi Gadai Kita',
        address: 'Jakarta',
        phone: '021000000',
        email: 'info@pegadaiancontoh.co.id',
      },
    });
  }

  // 1. Ensure Roles Exist
  const roleNames: RoleName[] = ['ADMIN', 'KASIR', 'MANAJER'];
  for (const roleName of roleNames) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log('✅ Roles ensured');

  // 2. Branches
  const branches = ['Kantor Pusat', 'Cabang Bandung', 'Cabang Jakarta'];
  for (const b of branches) {
    const code = b === 'Kantor Pusat' ? 'KP' : b === 'Cabang Bandung' ? 'BDG' : 'JKT';
    await prisma.branch.upsert({
      where: { name: b },
      update: {},
      create: { code, name: b, isActive: true },
    });
  }
  console.log('✅ Branches seeded');

  // 3. User Upserts with CONNECT syntax (Safer)
  const passwords = {
    default: await bcrypt.hash('admin123', 10),
    manager: await bcrypt.hash('manager123', 10),
  };

  // Helper to upsert user securely
  const upsertUser = async (username: string, fullName: string, role: RoleName, branch: string, pass: string) => {
    console.log(`Processing user: ${username} -> Role: ${role}, Branch: ${branch}`);

    await prisma.user.upsert({
      where: { username },
      update: {
        passwordHash: pass,
        isActive: true,
        role: { connect: { name: role } },
        branch: { connect: { name: branch } },
      },
      create: {
        username,
        passwordHash: pass,
        fullName,
        isActive: true,
        role: { connect: { name: role } },
        branch: { connect: { name: branch } },
      },
    });
  };

  await upsertUser('admin', 'Administrator Pusat', 'ADMIN', 'Kantor Pusat', passwords.default);
  await upsertUser('kasir_dev', 'Kasir Kantor Pusat', 'KASIR', 'Kantor Pusat', passwords.default);
  await upsertUser('admin_bdg', 'Admin Cabang Bandung', 'ADMIN', 'Cabang Bandung', passwords.default);
  await upsertUser('kasir_bdg', 'Kasir Cabang Bandung', 'KASIR', 'Cabang Bandung', passwords.default);

  // THE MANAGER FIX
  await upsertUser('manager', 'Manager Operasional', 'MANAJER', 'Kantor Pusat', passwords.manager);

  console.log('✅ Users seeded with CONNECT syntax');

  // 4. VERIFICATION LOG
  const managerCheck = await prisma.user.findUnique({
    where: { username: 'manager' },
    include: { role: true, branch: true }
  });

  console.log('🔍 VERIFICATION FOR MANAGER:');
  console.log(`   - Username: ${managerCheck?.username}`);
  console.log(`   - Role: ${managerCheck?.role?.name}`); // Should be MANAJER
  console.log(`   - Branch: ${managerCheck?.branch?.name}`); // Should be Kantor Pusat

  if (managerCheck?.role?.name !== 'MANAJER') {
    console.error('❌ CRITICAL: MANAGER ROLE IS STILL WRONG!');
  } else {
    console.log('✅ SUCCESS: Manager role is correct.');
  }

  // Normalization logic removed for this debug version
  // If needed, can be added back with proper orphan loan detection

  console.log('🌱 Seed completed.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
