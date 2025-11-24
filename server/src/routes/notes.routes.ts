import express, { Router, Request, Response } from 'express';
import prisma from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router: Router = express.Router();

// All note routes require authentication
router.use(authenticate);

// Get notes for a project
router.get('/', async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        // Verify user owns the project
        const project = await prisma.project.findUnique({
            where: { id: projectId as string },
        });
        if (!project || project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const notes = await prisma.note.findMany({
            where: { projectId: projectId as string },
            orderBy: { createdAt: 'desc' },
        });

        res.json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create note
router.post('/', async (req: Request, res: Response) => {
    try {
        const { projectId, noteText } = req.body;

        if (!projectId || !noteText) {
            res.status(400).json({ error: 'Project ID and note text are required' });
            return;
        }

        // Verify user owns the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project || project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const note = await prisma.note.create({
            data: {
                projectId,
                noteText,
            },
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update note
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { noteText } = req.body;

        if (!noteText) {
            res.status(400).json({ error: 'Note text is required' });
            return;
        }

        // Check ownership
        const existing = await prisma.note.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!existing) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }
        if (existing.project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const note = await prisma.note.update({
            where: { id },
            data: { noteText },
        });

        res.json(note);
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete note
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.note.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!existing) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }
        if (existing.project.createdByUserId !== req.userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await prisma.note.delete({ where: { id } });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;
