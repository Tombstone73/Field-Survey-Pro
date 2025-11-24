import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../utils/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router: Router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error as Error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// All photo routes require authentication
router.use(authenticate);

// Get photos (by project or portfolio)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { projectId, portfolio } = req.query;

        const where: any = {};

        if (projectId) {
            // Verify user owns the project
            const project = await prisma.project.findUnique({
                where: { id: projectId as string },
            });
            if (!project || project.createdByUserId !== req.userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            where.projectId = projectId;
        }

        if (portfolio === 'true') {
            where.isPortfolio = true;
        }

        const photos = await prisma.photo.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                project: {
                    select: {
                        jobNumber: true,
                        clientName: true,
                    },
                },
            },
        });

        res.json(photos);
    } catch (error) {
        console.error('Get photos error:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

// Upload photo(s)
router.post('/', upload.single('photo'), async (req: Request, res: Response) => {
    try {
        const { projectId, caption, isPortfolio } = req.body;

        if (!req.file) {
            res.status(400).json({ error: 'Photo file is required' });
            return;
        }

        if (!projectId) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        // Verify user owns the project and get current status
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project || project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Create photo with current project status captured
        const photo = await prisma.photo.create({
            data: {
                projectId,
                imageFile: req.file.filename,
                caption: caption || null,
                isPortfolio: isPortfolio === 'true',
                statusAtCapture: project.status, // Capture current project status
            },
        });

        res.status(201).json(photo);
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// Bulk update portfolio status
router.post('/portfolio-bulk', async (req: Request, res: Response) => {
    try {
        const { photoIds, isPortfolio } = req.body;

        if (!Array.isArray(photoIds) || photoIds.length === 0) {
            res.status(400).json({ error: 'photoIds must be a non-empty array' });
            return;
        }

        if (typeof isPortfolio !== 'boolean') {
            res.status(400).json({ error: 'isPortfolio must be a boolean' });
            return;
        }

        // Fetch all photos with their projects to verify ownership
        const photos = await prisma.photo.findMany({
            where: {
                id: { in: photoIds },
            },
            include: {
                project: true,
            },
        });

        // Verify all photos belong to projects owned by the user
        const unauthorizedPhotos = photos.filter(
            (photo) => photo.project.createdByUserId !== req.userId
        );

        if (unauthorizedPhotos.length > 0) {
            res.status(403).json({ error: 'Access denied to some photos' });
            return;
        }

        // Update all photos in a single transaction
        await prisma.photo.updateMany({
            where: {
                id: { in: photoIds },
            },
            data: {
                isPortfolio,
            },
        });

        res.json({ message: `Updated ${photoIds.length} photos`, count: photoIds.length });
    } catch (error) {
        console.error('Bulk portfolio update error:', error);
        res.status(500).json({ error: 'Failed to update photos' });
    }
});

// Get single photo
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const photo = await prisma.photo.findUnique({
            where: { id },
            include: {
                project: true,
            },
        });

        if (!photo) {
            res.status(404).json({ error: 'Photo not found' });
            return;
        }

        // Check ownership
        if (photo.project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json(photo);
    } catch (error) {
        console.error('Get photo error:', error);
        res.status(500).json({ error: 'Failed to fetch photo' });
    }
});

// Update photo
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { caption, isPortfolio } = req.body;

        // Check ownership
        const existing = await prisma.photo.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!existing) {
            res.status(404).json({ error: 'Photo not found' });
            return;
        }
        if (existing.project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const photo = await prisma.photo.update({
            where: { id },
            data: {
                caption,
                isPortfolio,
            },
        });

        res.json(photo);
    } catch (error) {
        console.error('Update photo error:', error);
        res.status(500).json({ error: 'Failed to update photo' });
    }
});

// Delete photo
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.photo.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!existing) {
            res.status(404).json({ error: 'Photo not found' });
            return;
        }
        if (existing.project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Delete file from filesystem
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path.join(uploadDir, existing.imageFile);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Failed to delete file:', error);
        }

        await prisma.photo.delete({ where: { id } });

        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// Update photo annotations
router.put('/:id/annotations', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { annotations, updatedAnnotatedImage } = req.body;
        const userId = req.userId;

        // Verify ownership
        const photo = await prisma.photo.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        if (photo.project.createdByUserId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData: any = { annotations };
        if (updatedAnnotatedImage) {
            updateData.annotatedImagePath = updatedAnnotatedImage;
        }

        const updatedPhoto = await prisma.photo.update({
            where: { id },
            data: updateData
        });

        res.json(updatedPhoto);
    } catch (error) {
        console.error('Failed to update annotations:', error);
        res.status(500).json({ error: 'Failed to update annotations' });
    }
});

export default router;
