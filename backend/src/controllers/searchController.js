import prisma from '../config/database.js';

const normalizeQuery = (value = '') => String(value).trim().replace(/^[@#]+/, '').trim();

export const search = async (req, res) => {
  try {
    const rawQuery = String(req.query.query || '').trim();
    const type = String(req.query.type || 'all').toLowerCase();

    if (!rawQuery) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const query = normalizeQuery(rawQuery);
    if (!query) {
      return res.json({ success: true, data: { users: [], posts: [], hashtags: [] } });
    }

    const data = { users: [], posts: [], hashtags: [] };
    const wants = (name) => type === 'all' || type === name;

    // Run each search independently so one database/query issue does not make
    // the complete unified search fail.
    const tasks = [];

    if (wants('users')) {
      tasks.push((async () => {
        const phoneDigits = rawQuery.replace(/\D/g, '');
        const userOr = [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } }
        ];
        if (phoneDigits.length >= 5) userOr.push({ phoneNumber: { contains: phoneDigits } });

        const users = await prisma.user.findMany({
          where: { OR: userOr, status: { not: 'deleted' } },
          select: { id: true, username: true, fullName: true, avatarUrl: true, bio: true },
          orderBy: { username: 'asc' },
          take: 15
        });
        data.users = users;
      })());
    }

    if (wants('posts')) {
      tasks.push((async () => {
        const posts = await prisma.post.findMany({
          where: {
            status: 'approved',
            content: { contains: query, mode: 'insensitive' }
          },
          include: {
            user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
            likes: { select: { id: true } },
            comments: { select: { id: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 15
        });
        data.posts = posts.map(post => ({
          ...post,
          likesCount: post.likes.length,
          commentsCount: post.comments.length
        }));
      })());
    }

    if (wants('hashtags')) {
      tasks.push((async () => {
        const hashtags = await prisma.hashtag.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          include: { posts: { select: { postId: true } } },
          orderBy: { name: 'asc' },
          take: 15
        });
        data.hashtags = hashtags.map(tag => ({
          id: tag.id,
          name: tag.name,
          postsCount: tag.posts.length
        }));
      })());
    }

    const settled = await Promise.allSettled(tasks);
    const failed = settled.find(result => result.status === 'rejected');
    if (failed) console.error('Search partial failure:', failed.reason);

    return res.json({
      success: true,
      data,
      query: rawQuery,
      type
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
};
