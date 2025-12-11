import { getAuth } from '@clerk/express';

export const protect = async (req, res, next) => {
    try {
        const { userId } = getAuth(req);

        if(!userId) {
            return res.status(401).json({ message: "Unauthorized"})
        }
        return next()
    } catch (error) {
         console.log(error);
         res.status(401).json({ message: error.code || error.message });
        
    }
}