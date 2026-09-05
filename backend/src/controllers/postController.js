import prisma from '../config/database.js';
import { cloudinary } from '../config/cloudinary.js';

export const createPost = async (req, res) => {
  try {
    const { content, mediaUrl, mediaType, hashtags } = req.body;
    const userId = req.userId;

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Content or media is required' });
    }

    const post = await prisma.post.create({
      data: { userId, content, mediaUrl, mediaType },
      include: { user: { select: { id: true, username: true, fullName: true, avatarUrl: true } } }
    });

    if (hashtags && hashtags.length > 0) {
      for (const tagName of hashtags) {
        const hashtag = await prisma.hashtag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });
        await prisma.postHashtag.create({ data: { postId: post.id, hashtagId: hashtag.id } });
      }
    }

    res.status(201).json({ success: true, message: 'Post created successfully', data: post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { status: { not: 'rejected' } },
      include: {
        user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        likes: { select: { id: true } },
        comments: { select: { id: true } },
        hashtags: { include: { hashtag: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      hashtags: post.hashtags.map(h => h.hashtag.name)
    }));

    res.json({ success: true, data: formattedPosts, pagination: { page: parseInt(page), limit: parseInt(limit), total: posts.length } });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        likes: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        comments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
        hashtags: { include: { hashtag: { select: { name: true } } } }
      }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({
      success: true,
      data: { ...post, likesCount: post.likes.length, commentsCount: post.comments.length, hashtags: post.hashtags.map(h => h.hashtag.name) }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    if (post.mediaUrl) {
      const publicId = post.mediaUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await prisma.post.delete({ where: { id } });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.userId;

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.json({ success: true, message: 'Post unliked', data: { liked: false } });
    } else {
      await prisma.like.create({ data: { userId, postId } });

      const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
      if (post.userId !== userId) {
        await prisma.notification.create({
          data: { receiverId: post.userId, senderId: userId, type: 'like', postId, message: 'liked your post' }
        });
      }

      res.json({ success: true, message: 'Post liked', data: { liked: true } });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const comment = await prisma.comment.create({
      data: { userId, postId, content },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } }
    });

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post.userId !== userId) {
      await prisma.notification.create({
        data: { receiverId: post.userId, senderId: userId, type: 'comment', postId, message: 'commented on your post' }
      });
    }

    res.status(201).json({ success: true, message: 'Comment added', data: comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};