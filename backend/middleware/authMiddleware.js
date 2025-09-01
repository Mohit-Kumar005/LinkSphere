import { auth } from '../firebaseAdmin.js';

const authMiddleware = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer')) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }
    const idToken = authorization.split('Bearer ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send({ message: 'Unauthorized: Invalid token.' });
    }
};

export default authMiddleware;
