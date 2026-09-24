import prisma from '../config/database.js';

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    if (userId === followerId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: userId } }
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId: userId } }
      });
      res.json({ success: true, message: 'Unfollowed', data: { following: false } });
    } else {
      await prisma.follow.create({ data: { followerId, followingId: userId } });

      await prisma.notification.create({
        data: { receiverId: userId, senderId: followerId, type: 'follow', message: 'started following you' }
      });

      res.json({ success: true, message: 'Following', data: { following: true } });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ success: false, message: 'Failed to follow user' });
  }
};

export const getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: userId } }
    });

    res.json({ success: true, data: { following: !!follow } });
  } catch (error) {
    console.error('Get follow status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get follow status' });
  }
};

const listConnections = async (req, res, mode) => {
  try {
    const userId = req.userId;
    const where = mode === 'followers' ? { followingId: userId } : { followerId: userId };
    const relation = mode === 'followers' ? 'follower' : 'following';
    const rows = await prisma.follow.findMany({
      where,
      include: { [relation]: { select: { id: true, username: true, fullName: true, avatarUrl: true, bio: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: { users: rows.map((row) => row[relation]) } });
  } catch (error) {
    console.error(`List ${mode} error:`, error);
    return res.status(500).json({ success: false, message: `Failed to load ${mode}` });
  }
};

export const getMyFollowers = (req, res) => listConnections(req, res, 'followers');
export const getMyFollowing = (req, res) => listConnections(req, res, 'following');
