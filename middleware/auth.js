const jwt = require('jsonwebtoken');

   const authMiddleware = (req, res, next) => {
     try {
       const token = req.cookies.token;
       
       if (!token) {
         return res.status(401).json({
           success: false,
           message: 'Please log in to access this resource',
         });
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (error) {
       res.status(400).json({
         success: false,
         message: 'Invalid or expired token',
       });
     }
   };

   module.exports = authMiddleware;