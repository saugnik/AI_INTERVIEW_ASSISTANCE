# Database Setup

## Prerequisites
- PostgreSQL installed and running
- Node.js and npm installed

## Setup Steps

### 1. Install Prisma
```bash
npm install prisma @prisma/client
```

### 2. Set Database URL
Create `.env` file in project root:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_interview_db?schema=public"
```

Replace `username`, `password`, and database name as needed.

### 3. Generate Migration
```bash
npx prisma migrate dev --name init
```

This will:
- Create the migration SQL files
- Apply the migration to your database
- Generate Prisma Client

### 4. Generate Prisma Client (if needed separately)
```bash
npx prisma generate
```

## Usage

Import Prisma Client in your code:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example: Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    metadata: { theme: 'dark' }
  }
});
```

## Useful Commands

- View database in Prisma Studio: `npx prisma studio`
- Reset database: `npx prisma migrate reset`
- Apply migrations: `npx prisma migrate deploy`
- Format schema: `npx prisma format`
