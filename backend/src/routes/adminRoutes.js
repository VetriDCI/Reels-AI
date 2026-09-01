import express from 'express';
const router = express.Router();
router.get('/stats', (req,res)=>res.json({totalUsers:1250,totalPosts:5432,totalReels:3210,pendingPayouts:12500,activeUsers:890,reportedContent:12}));
router.get('/users', (req,res)=>res.json([{id:'1',full_name:'Vetri',username:'vetri',email:'vetri@test.com',status:'active',earnings:5000,created_at:new Date()}]));
router.patch('/users/:id/status', (req,res)=>res.json({success:true}));
export default router;
