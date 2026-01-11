import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkEmailInAuthUsers() {
    try {
        const targetEmail = 'asaugnik@gmail.com';
        const user = await prisma.auth_users.findUnique({
            where: { email: targetEmail }
        });
        console.log(`\n🔍 Checking if ${targetEmail} exists in auth_users table:`);
        if (user) {
            console.log('✅ YES - User exists!');
            console.log('   Name:', user.name);
            console.log('   Role:', user.role);
            console.log('   Created:', user.created_at);
        } else {
            console.log('❌ NO - User does NOT exist!');
            console.log('\n⚠️ THIS IS THE PROBLEM!');
            console.log('The attempts table requires student_email to exist in auth_users.');
            console.log('When you login, your email should be saved to auth_users automatically.');
            console.log('\nLet me add you now...');
            const newUser = await prisma.auth_users.create({
                data: {
                    email: targetEmail,
                    name: 'Saugnik Aich',
                    role: 'student',
                    provider: 'google'
                }
            });
            console.log('\n✅ User added successfully!');
            console.log('   Email:', newUser.email);
            console.log('   Name:', newUser.name);
            console.log('   Role:', newUser.role);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}
checkEmailInAuthUsers();