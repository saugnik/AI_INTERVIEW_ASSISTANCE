import { defineConfig } from '@prisma/client/config';

export default defineConfig({
    datasources: {
        db: {
            url: 'postgresql://postgres:postgres@localhost:5432/interview_db?schema=public'
        }
    }
});
