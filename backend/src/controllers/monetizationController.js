import prisma from '../config/database.js';

// These are intentionally local app rules; no payment provider or external charge is required.
export const MONETIZATION_REQUIREMENTS = {
  minFollowers: 1000,
  minPosts: 10,
};

const getEligibility = (followersCount, postsCount) =>
  followersCount >= MONETIZATION_REQUIREMENTS.minFollowers &&
  postsCount >= MONETIZATION_REQUIREMENTS.minPosts;

export const getMonetizationStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        monetizationStatus: true,
        monetizationAppliedAt: true,
        monetizationApprovedAt: true,
        earnings: true,
        _count: { select: { followers: true, posts: true } },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const eligible = getEligibility(user._count.followers, user._count.posts);

    // Never overwrite a submitted/approved application. Before applying, expose
    // the live eligibility state so the button can be disabled/enabled correctly.
    const status = ['pending', 'approved'].includes(user.monetizationStatus)
      ? user.monetizationStatus
      : eligible ? 'eligible' : 'not_eligible';

    res.json({
      success: true,
      data: {
        status,
        active: user.monetizationStatus === 'approved',
        eligible,
        requirements: MONETIZATION_REQUIREMENTS,
        followers: user._count.followers,
        posts: user._count.posts,
        earnings: user.earnings,
        appliedAt: user.monetizationAppliedAt,
        approvedAt: user.monetizationApprovedAt,
      },
    });
  } catch (error) {
    console.error('Get monetization status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monetization status' });
  }
};

export const applyForMonetization = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        monetizationStatus: true,
        _count: { select: { followers: true, posts: true } },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.monetizationStatus === 'pending') {
      return res.status(409).json({ success: false, message: 'Monetization application is already pending' });
    }
    if (user.monetizationStatus === 'approved') {
      return res.status(409).json({ success: false, message: 'Monetization is already active' });
    }

    const eligible = getEligibility(user._count.followers, user._count.posts);
    if (!eligible) {
      return res.status(403).json({
        success: false,
        message: `You are not eligible yet. You need at least ${MONETIZATION_REQUIREMENTS.minFollowers} followers and ${MONETIZATION_REQUIREMENTS.minPosts} posts.`,
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        monetizationStatus: 'pending',
        monetizationAppliedAt: new Date(),
      },
      select: { monetizationStatus: true, monetizationAppliedAt: true },
    });

    res.json({
      success: true,
      message: 'Monetization application submitted successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Apply monetization error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit monetization application' });
  }
};
