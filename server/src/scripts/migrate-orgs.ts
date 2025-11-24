import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');

    const users = await prisma.user.findMany({
        include: {
            organizationMemberships: true
        }
    });

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        if (user.organizationMemberships.length === 0) {
            console.log(`Migrating user: ${user.email}`);

            // Create Personal Org
            const orgName = `${user.name || user.email}'s Personal Org`;
            const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const org = await prisma.organization.create({
                data: {
                    name: orgName,
                    joinCode: joinCode,
                    createdByUserId: user.id,
                    members: {
                        create: {
                            userId: user.id,
                            role: 'OWNER'
                        }
                    }
                }
            });

            console.log(`Created org: ${org.name} (${org.id})`);

            // Update User's current org
            await prisma.user.update({
                where: { id: user.id },
                data: { currentOrganizationId: org.id }
            });

            // Migrate Projects
            // Find projects created by this user that don't have an org yet
            const projects = await prisma.project.findMany({
                where: {
                    createdByUserId: user.id,
                    organizationId: null
                }
            });

            console.log(`Found ${projects.length} projects to migrate for user.`);

            if (projects.length > 0) {
                await prisma.project.updateMany({
                    where: {
                        createdByUserId: user.id,
                        organizationId: null
                    },
                    data: {
                        organizationId: org.id,
                        ownerId: user.id
                    }
                });
                console.log(`Migrated ${projects.length} projects.`);
            }
        } else {
            console.log(`User ${user.email} already has an organization. Skipping.`);
        }
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
