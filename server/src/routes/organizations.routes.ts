import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/organizations/me - Get current user's organization
router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                currentOrganization: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                organizationMemberships: {
                    include: {
                        organization: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's role in current org
        let userRole = null;
        if (user.currentOrganization) {
            const membership = user.organizationMemberships.find(
                m => m.organizationId === user.currentOrganizationId
            );
            userRole = membership?.role || null;
        }

        res.json({
            organization: user.currentOrganization,
            userRole,
            allMemberships: user.organizationMemberships
        });
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Failed to fetch organization' });
    }
});

// POST /api/organizations - Create new organization
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        // Generate unique join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const organization = await prisma.organization.create({
            data: {
                name: name.trim(),
                joinCode,
                createdByUserId: userId,
                members: {
                    create: {
                        userId,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Set as current organization
        await prisma.user.update({
            where: { id: userId },
            data: { currentOrganizationId: organization.id }
        });

        // Assign any orphan projects to this org
        await prisma.project.updateMany({
            where: {
                createdByUserId: userId,
                organizationId: null
            },
            data: {
                organizationId: organization.id,
                ownerId: userId
            }
        });

        res.status(201).json(organization);
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({ error: 'Failed to create organization' });
    }
});

// POST /api/organizations/join - Join organization via join code
router.post('/join', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { joinCode } = req.body;

        if (!joinCode || joinCode.trim() === '') {
            return res.status(400).json({ error: 'Join code is required' });
        }

        const organization = await prisma.organization.findUnique({
            where: { joinCode: joinCode.trim().toUpperCase() }
        });

        if (!organization) {
            return res.status(400).json({ error: 'Invalid join code' });
        }

        // Check if already a member
        const existingMembership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: organization.id,
                    userId
                }
            }
        });

        if (existingMembership) {
            // Just set as current org
            await prisma.user.update({
                where: { id: userId },
                data: { currentOrganizationId: organization.id }
            });

            return res.json({
                message: 'Already a member. Set as current organization.',
                organization,
                membership: existingMembership
            });
        }

        // Create membership
        const membership = await prisma.organizationMember.create({
            data: {
                organizationId: organization.id,
                userId,
                role: 'MEMBER'
            }
        });

        // Set as current organization
        await prisma.user.update({
            where: { id: userId },
            data: { currentOrganizationId: organization.id }
        });

        res.json({
            message: 'Successfully joined organization',
            organization,
            membership
        });
    } catch (error) {
        console.error('Error joining organization:', error);
        res.status(500).json({ error: 'Failed to join organization' });
    }
});

// POST /api/organizations/regenerate-code - Regenerate join code (OWNER/ADMIN only)
router.post('/regenerate-code', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organizationMemberships: true
            }
        });

        if (!user || !user.currentOrganizationId) {
            return res.status(400).json({ error: 'No current organization' });
        }

        // Check role
        const membership = user.organizationMemberships.find(
            m => m.organizationId === user.currentOrganizationId
        );

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return res.status(403).json({ error: 'Only owners and admins can regenerate join codes' });
        }

        // Generate new code
        const newJoinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const organization = await prisma.organization.update({
            where: { id: user.currentOrganizationId },
            data: { joinCode: newJoinCode }
        });

        res.json({
            message: 'Join code regenerated successfully',
            organization
        });
    } catch (error) {
        console.error('Error regenerating join code:', error);
        res.status(500).json({ error: 'Failed to regenerate join code' });
    }
});

export default router;
