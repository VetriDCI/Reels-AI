import prisma from '../config/database.js';

export const search = async (req, res) => {
  try {
    const { query, type = 'all' } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const results = {};

    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, username: true, fullName: true, avatarUrl: true, bio: true },
        take: 10
      });
      results.users = users;
    }

    if (type === 'all' || type === 'posts') {
      const posts = await prisma.post.findMany({
        where: { content: { contains: query, mode: 'insensitive' } },
        include: {
          user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
          likes: { select: { id: true } },
          comments: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      results.posts = posts.map(post => ({ ...post, likesCount: post.likes.length, commentsCount: post.comments.length }));
    }

    if (type === 'all' || type === 'hashtags') {
      const hashtags = await prisma.hashtag.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        include: { posts: { select: { id: true } } },
        take: 10
      });
      results.hashtags = hashtags.map(tag => ({ ...tag, postsCount: tag.posts.length }));
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};