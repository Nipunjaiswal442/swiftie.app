import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { Post } from '../models/Post';
import { User } from '../models/User';

export const postsRouter = Router();
postsRouter.use(authMiddleware);

/** GET /api/v1/feed */
postsRouter.get('/feed', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = await User.findById(req.user!.userId).select('following');
    const feedUsers = me ? [...me.following, me._id] : [req.user!.userId];
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = 20;

    const posts = await Post.find({ author: { $in: feedUsers } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'displayName username profilePhotoUrl');

    res.json({ success: true, data: posts });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
});

/** POST /api/v1/posts */
postsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { caption, category, imageUrl } = req.body as {
      caption?: string; category?: string; imageUrl?: string;
    };
    const post = await Post.create({
      author: req.user!.userId,
      caption: caption || '',
      category: category || 'General',
      imageUrl: imageUrl || '',
    });
    await User.findByIdAndUpdate(req.user!.userId, { $inc: { postsCount: 1 } });
    await post.populate('author', 'displayName username profilePhotoUrl');
    res.status(201).json({ success: true, data: post });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

/** GET /api/v1/posts/:id */
postsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'displayName username profilePhotoUrl');
    if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }
    res.json({ success: true, data: post });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

/** DELETE /api/v1/posts/:id */
postsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }
    if (post.author.toString() !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' }); return;
    }
    await post.deleteOne();
    await User.findByIdAndUpdate(req.user!.userId, { $inc: { postsCount: -1 } });
    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

/** POST /api/v1/posts/:id/like */
postsRouter.post('/:id/like', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.user!.userId }, $inc: { likesCount: 0 } },
      { new: true }
    );
    if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }
    post.likesCount = post.likes.length;
    await post.save();
    res.json({ success: true, data: { liked: true, likesCount: post.likesCount } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to like post' });
  }
});

/** DELETE /api/v1/posts/:id/like */
postsRouter.delete('/:id/like', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: req.user!.userId } },
      { new: true }
    );
    if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }
    post.likesCount = post.likes.length;
    await post.save();
    res.json({ success: true, data: { liked: false, likesCount: post.likesCount } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unlike post' });
  }
});

/** POST /api/v1/posts/:id/comments */
postsRouter.post('/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body as { text?: string };
    if (!text?.trim()) { res.status(400).json({ success: false, error: 'Comment text is required' }); return; }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { author: req.user!.userId, text: text.trim() } }, $inc: { commentsCount: 1 } },
      { new: true }
    ).populate('comments.author', 'displayName username profilePhotoUrl');

    if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }
    res.status(201).json({ success: true, data: post.comments[post.comments.length - 1] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});
