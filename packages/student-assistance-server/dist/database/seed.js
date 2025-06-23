"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const DEFAULT_EXPENSE_TYPES = [
    {
        name: 'Alimentação',
        description: 'Despesas com alimentação e refeições',
        category: 'Necessidades Básicas',
        active: true,
    },
    {
        name: 'Transporte',
        description: 'Despesas com transporte público e locomoção',
        category: 'Necessidades Básicas',
        active: true,
    },
    {
        name: 'Material Escolar',
        description: 'Livros, cadernos e materiais de estudo',
        category: 'Educação',
        active: true,
    },
    {
        name: 'Medicamentos',
        description: 'Medicamentos e produtos farmacêuticos',
        category: 'Saúde',
        active: true,
    },
    {
        name: 'Vestuário',
        description: 'Roupas e calçados básicos',
        category: 'Necessidades Básicas',
        active: true,
    },
    {
        name: 'Moradia',
        description: 'Aluguel e despesas de moradia',
        category: 'Necessidades Básicas',
        active: true,
    },
];
const DEFAULT_RECEIVERS = [
    {
        address: '0x8ba1f109551bD432803012645Hac136c30c85BCF',
        name: 'Supermercado Central',
        cpfCnpj: '12.345.678/0001-90',
        type: 'establishment',
        verified: true,
        expenseTypes: ['Alimentação'],
    },
    {
        address: '0x9Cd085A327FdB6D2C8C0a5e5C1C8f7D5E2B3A4C1',
        name: 'Farmácia Saúde',
        cpfCnpj: '23.456.789/0001-01',
        type: 'establishment',
        verified: true,
        expenseTypes: ['Medicamentos'],
    },
    {
        address: '0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B',
        name: 'Livraria Acadêmica',
        cpfCnpj: '34.567.890/0001-12',
        type: 'establishment',
        verified: true,
        expenseTypes: ['Material Escolar'],
    },
];
async function main() {
    console.log('🌱 Starting database seed...');
    // Create admin user with specific wallet address
    const adminPassword = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            // Update the admin user if it exists
            passwordHash: adminPassword,
            role: 'admin',
        },
        create: {
            username: 'admin',
            passwordHash: adminPassword,
            role: 'admin',
        },
    });
    console.log(`✅ Admin user created/updated: ${admin.username}`);
    console.log(`📝 Admin wallet: 0xA1a522D50F2b72E6F395f3203961149C5B4d09A1`);
    // Create default staff user
    const staffPassword = await bcryptjs_1.default.hash('staff123', 12);
    const staff = await prisma.user.upsert({
        where: { username: 'staff' },
        update: {},
        create: {
            username: 'staff',
            passwordHash: staffPassword,
            role: 'staff',
        },
    });
    console.log(`✅ Staff user created/updated: ${staff.username}`);
    // Create expense types
    for (const expenseType of DEFAULT_EXPENSE_TYPES) {
        const created = await prisma.expenseType.upsert({
            where: { name: expenseType.name },
            update: expenseType,
            create: expenseType,
        });
        console.log(`✅ Expense type created/updated: ${created.name}`);
    }
    // Create some sample students (but not the actual MetaMask addresses yet)
    const sampleStudents = [
        {
            walletAddress: '0x1234567890123456789012345678901234567890',
            name: 'João Silva',
            cpf: '12345678901',
            university: 'UFSC',
            monthlyAmount: 500.00,
        },
        {
            walletAddress: '0x2345678901234567890123456789012345678901',
            name: 'Maria Santos',
            cpf: '23456789012',
            university: 'UFSC',
            monthlyAmount: 600.00,
        },
        {
            walletAddress: '0x3456789012345678901234567890123456789012',
            name: 'Pedro Oliveira',
            cpf: '34567890123',
            university: 'UFSC',
            monthlyAmount: 450.00,
        },
    ];
    for (const studentData of sampleStudents) {
        const student = await prisma.student.upsert({
            where: { walletAddress: studentData.walletAddress },
            update: studentData,
            create: studentData,
        });
        console.log(`✅ Sample student created/updated: ${student.name}`);
    }
    // Create sample receivers
    for (const receiverData of DEFAULT_RECEIVERS) {
        const { expenseTypes: expenseTypeNames, ...receiverInfo } = receiverData;
        const receiver = await prisma.receiver.upsert({
            where: { address: receiverData.address },
            update: receiverInfo,
            create: receiverInfo,
        });
        console.log(`✅ Receiver created/updated: ${receiver.name}`);
        // Link receiver to expense types
        const expenseTypes = await prisma.expenseType.findMany({
            where: {
                name: { in: expenseTypeNames },
            },
        });
        for (const expenseType of expenseTypes) {
            await prisma.receiverExpenseType.upsert({
                where: {
                    receiverAddress_expenseTypeId: {
                        receiverAddress: receiver.address,
                        expenseTypeId: expenseType.id,
                    },
                },
                update: {},
                create: {
                    receiverAddress: receiver.address,
                    expenseTypeId: expenseType.id,
                },
            });
            console.log(`✅ Linked ${receiver.name} to ${expenseType.name}`);
        }
    }
    console.log('🎉 Database seed completed successfully!');
    console.log('\n📝 Default credentials:');
    console.log('Admin: username="admin", password="admin123"');
    console.log('Staff: username="staff", password="staff123"');
    console.log('\n🔑 Wallet Addresses:');
    console.log('Admin wallet: 0xA1a522D50F2b72E6F395f3203961149C5B4d09A1');
    console.log('Student wallet: 0xA7868E049c067A49CD33726D3Edc4163a147B4Ad (to be registered via dashboard)');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map