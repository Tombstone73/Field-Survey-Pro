import express, { Router, Request, Response } from 'express';
import prisma from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prismaClient = new PrismaClient();

// All project routes require authentication
router.use(authenticate);

// GET /api/projects - Get all projects (scoped by organization)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;

        // Get user's current organization
        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            select: { currentOrganizationId: true }
        });

        if (!user?.currentOrganizationId) {
            return res.status(400).json({
                error: 'You must create or join an organization before viewing projects'
            });
        }

        const where: any = {
            organizationId: user.currentOrganizationId,
        };

        // Add search filter
        if (search) {
            where.OR = [
                { jobNumber: { contains: search as string, mode: 'insensitive' } },
                { clientName: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        // Add status filter
        if (status) {
            where.status = status;
        }

        const projects = await prismaClient.project.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { photos: true, notes: true },
                },
            },
        });

        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
    try {
        const { jobNumber, clientName, siteAddress, status, projectNotes } = req.body;

        // Validate required fields
        if (!jobNumber || !clientName) {
            res.status(400).json({ error: 'Job number and client name are required' });
            return;
        }

        // Get user's current organization
        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            select: { currentOrganizationId: true }
        });

        if (!user?.currentOrganizationId) {
            return res.status(400).json({
                error: 'You must create or join an organization before creating projects'
            });
        }

        const project = await prismaClient.project.create({
            data: {
                jobNumber,
                clientName,
                siteAddress,
                status: status || 'SURVEY',
                projectNotes,
                createdByUserId: req.userId!,
                organizationId: user.currentOrganizationId,
                ownerId: req.userId!,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const project = await prismaClient.project.findUnique({
            where: { id },
            include: {
                photos: {
                    orderBy: { createdAt: 'desc' },
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Check organization access
        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            select: { currentOrganizationId: true }
        });

        if (project.organizationId !== user?.currentOrganizationId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { jobNumber, clientName, siteAddress, status, projectNotes } = req.body;

        // Check organization access
        const existing = await prismaClient.project.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            select: { currentOrganizationId: true }
        });

        if (existing.organizationId !== user?.currentOrganizationId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const project = await prismaClient.project.update({
            where: { id },
            data: {
                jobNumber,
                clientName,
                siteAddress,
                status,
                projectNotes,
            },
        });

        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check organization access
        const existing = await prismaClient.project.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            select: { currentOrganizationId: true }
        });

        if (existing.organizationId !== user?.currentOrganizationId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await prismaClient.project.delete({ where: { id } });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// POST /api/projects/:id/share - Create share link
router.post('/:id/share', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check organization access
        const project = await prismaClient.project.findUnique({ where: { id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            select: { currentOrganizationId: true }
        });

        if (project.organizationId !== user?.currentOrganizationId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if share link already exists
        const existingLink = await prismaClient.projectShareLink.findFirst({
            where: { projectId: id }
        });

        if (existingLink) {
            return res.json({
                shareUrl: `/share/${existingLink.token}`,
                token: existingLink.token
            });
        }

        // Create new share link
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const shareLink = await prismaClient.projectShareLink.create({
            data: {
                projectId: id,
                token,
                allowDownload: false
            }
        });

        res.json({
            shareUrl: `/share/${shareLink.token}`,
            token: shareLink.token
        });
    } catch (error) {
        console.error('Create share link error:', error);
        res.status(500).json({ error: 'Failed to create share link' });
    }
});

export default router;
