import prisma from '../config/database.js';

export const getMyReports = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const where = { reporterId: req.userId };
    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        select: { id:true, reason:true, status:true, createdAt:true, updatedAt:true, post:{select:{id:true,content:true,mediaUrl:true,mediaType:true,thumbnailUrl:true,status:true,createdAt:true,user:{select:{id:true,username:true,fullName:true,avatarUrl:true}}}}}
      })
    ]);
    res.json({ success:true, data:reports, pagination:{page,limit,total,hasMore:page*limit<total} });
  } catch (error) {
    console.error('My reports error:', error);
    res.status(500).json({ success:false, message:'Failed to load report history' });
  }
};
