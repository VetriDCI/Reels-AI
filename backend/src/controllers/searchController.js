import prisma from '../config/database.js';

const normalizeQuery = (value = '') => String(value).trim().replace(/^[@#]+/, '').trim();

export const search = async (req, res) => {
  const rawQuery = String(req.query.query ?? req.query.q ?? '').trim();
  const type = String(req.query.type || 'all').toLowerCase();

  if (!rawQuery) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  const query = normalizeQuery(rawQuery);
  if (!query) {
    return res.json({ success: true, data: { users: [], posts: [], hashtags: [] }, query: rawQuery, type });
  }

  const wants = (name) => type === 'all' || type === name || (name === 'users' && type === 'user') || (name === 'posts' && type === 'post') || (name === 'hashtags' && type === 'hashtag');
  const data = { users: [], posts: [], hashtags: [] };
  const errors = [];

  const tasks = [];

  if (wants('users')) {
    const userOr = [
      { username: { contains: query, mode: 'insensitive' } },
      { fullName: { contains: query, mode: 'insensitive' } }
    ];
    const phoneDigits = query.replace(/\D/g, '');
    if (phoneDigits.length >= 5) userOr.push({ phoneNumber: { contains: phoneDigits } });
    tasks.push(
      prisma.user.findMany({
        where: {
          status: { not: 'deleted' },
          OR: userOr
        },
        select: { id: true, username: true, fullName: true, avatarUrl: true, bio: true },
        orderBy: { username: 'asc' },
        take: 20
      }).then(rows => { data.users = rows; }).catch(error => { errors.push({ category: 'users', message: error?.message || 'user search failed' }); })
    );
  }

  if (wants('posts')) {
    tasks.push(
      prisma.post.findMany({
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
        take: 20
      }).then(rows => {
        data.posts = rows.map(post => ({
          ...post,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          likes: undefined,
          comments: undefined
        }));
      }).catch(error => { errors.push({ category: 'posts', message: error?.message || 'post search failed' }); })
    );
  }

  if (wants('hashtags')) {
    tasks.push(
      prisma.hashtag.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        include: { posts: { select: { postId: true } } },
        orderBy: { name: 'asc' },
        take: 20
      }).then(rows => {
        data.hashtags = rows.map(tag => ({ id: tag.id, name: tag.name, postsCount: tag.posts.length }));
      }).catch(error => { errors.push({ category: 'hashtags', message: error?.message || 'hashtag search failed' }); })
    );
  }

  await Promise.all(tasks);

  if (errors.length) console.error('Search partial failure:', errors);

  return res.json({
    success: true,
    data,
    query: rawQuery,
    type,
    partial: errors.length > 0,
    available: {
      users: !errors.some(e => e.category === 'users'),
      posts: !errors.some(e => e.category === 'posts'),
      hashtags: !errors.some(e => e.category === 'hashtags')
    }
  });
};
