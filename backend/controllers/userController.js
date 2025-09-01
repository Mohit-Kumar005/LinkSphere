import admin, { db, auth } from '../firebaseAdmin.js';

// Controller to get a user's profile
export const getUserProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            const userRecord = await auth.getUser(uid);
            return res.status(200).json({
                uid: userRecord.uid,
                displayName: userRecord.displayName,
                email: userRecord.email,
                bio: "This user hasn't set up a bio yet."
            });
        }
        res.status(200).json({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
};

// Controller to get all posts by a specific user
export const getUserPosts = async (req, res) => {
    try {
        const { uid } = req.params;
        const postsSnapshot = await db.collection('posts')
            .where('authorId', '==', uid)
            .orderBy('timestamp', 'desc')
            .get();
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ error: 'Failed to fetch user posts.' });
    }
};

// Controller to create a user's profile in Firestore
export const createUserProfile = async (req, res) => {
    try {
        const { uid, email, name } = req.user;
        const { bio } = req.body;

        const userRef = db.collection('users').doc(uid);
        await userRef.set({
            displayName: name,
            email: email,
            bio: bio || "",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ message: 'User profile created successfully.' });

    } catch (error) {
        console.error("Error creating user profile:", error);
        res.status(500).json({ error: 'Failed to create user profile.' });
    }
};
