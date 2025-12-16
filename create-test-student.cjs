// Create test student in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestStudent() {
    try {
        // Create a test student
        const student = await prisma.auth_users.create({
            data: {
                email: 'teststudent@example.com',
                name: 'Test Student',
                role: 'student',
                google_id: 'test_google_id_' + Date.now(),
                picture: 'https://via.placeholder.com/150'
            }
        });

        console.log('✅ Test student created successfully!');
        console.log('Email:', student.email);
        console.log('Name:', student.name);
        console.log('Role:', student.role);

    } catch (error) {
        console.error('❌ Error creating student:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createTestStudent();
