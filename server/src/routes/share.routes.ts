import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/share/:token - Public read-only project view
router.get('/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const shareLink = await prisma.projectShareLink.findUnique({
            where: { token },
            include: {
                project: {
                    include: {
                        photos: {
                            orderBy: { createdAt: 'desc' }
                        },
                        notes: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });

        if (!shareLink) {
            return res.status(404).json({ error: 'Share link not found or expired' });
        }

        // Check if expired
        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
            return res.status(404).json({ error: 'Share link has expired' });
        }

        // Return sanitized project data
        const { project } = shareLink;
        res.json({
            jobNumber: project.jobNumber,
            clientName: project.clientName,
            siteAddress: project.siteAddress,
            status: project.status,
            photos: project.photos.map(photo => ({
                id: photo.id,
                imageFile: photo.imageFile,
                caption: photo.caption,
                annotations: photo.annotations,
                statusAtCapture: photo.statusAtCapture,
                createdAt: photo.createdAt
            })),
            notes: project.notes.map(note => ({
                id: note.id,
                noteText: note.noteText,
                createdAt: note.createdAt
            }))
        });
    } catch (error) {
        console.error('Get shared project error:', error);
        res.status(500).json({ error: 'Failed to fetch shared project' });
    }
});

export default router;
