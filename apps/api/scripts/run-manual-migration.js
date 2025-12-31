// Run manual SQL migration
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
    console.log('🔄 Running manual migration: add_photo_fields...');

    try {
        // Execute SQL statements directly
        console.log('\n[1/2] Adding photoUrl to Customer table...');
        await prisma.$executeRaw`
      ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT
    `;
        console.log('✅ Success');

        console.log('\n[2/2] Adding photoUrls to CollateralItem table...');
        await prisma.$executeRaw`
      ALTER TABLE "CollateralItem" ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] DEFAULT '{}'
    `;
        console.log('✅ Success');

        // Verify columns exist
        console.log('\n🔍 Verifying migration...');

        const customerCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' AND column_name = 'photoUrl'
    `;

        const collateralCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'CollateralItem' AND column_name = 'photoUrls'
    `;

        console.log('\n✅ Customer.photoUrl:', customerCheck.length > 0 ? 'EXISTS ✓' : 'NOT FOUND ✗');
        console.log('✅ CollateralItem.photoUrls:', collateralCheck.length > 0 ? 'EXISTS ✓' : 'NOT FOUND ✗');

        if (customerCheck.length > 0 && collateralCheck.length > 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📋 Summary:');
            console.log('  - Customer.photoUrl: TEXT (nullable)');
            console.log('  - CollateralItem.photoUrls: TEXT[] (default: {})');
        } else {
            console.error('\n❌ Migration verification failed!');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
