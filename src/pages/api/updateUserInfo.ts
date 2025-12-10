import prismaUsers from "../../../prismaUsersClient";
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from "../../../firebaseAdmin"; // Import Firebase Admin

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, givenName, email, currentEmail, altEmail } = req.body;

  if (!userId || !givenName || !email || !altEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Invalid email format in main email' });
  }
  if (!emailPattern.test(altEmail)) {
    return res.status(400).json({ error: 'Invalid email format in alt email' });
  }

  try {
    // Check if primary email already exists for another user
    const existingUser = await prismaUsers.users.findFirst({
      where: {
        email,
        NOT: {
          id: parseInt(userId)
        }
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Primary email is already in use by another account' });
    }

    // Update user info in your database
    const updatedUser = await prismaUsers.users.update({
      where: { id: parseInt(userId) },
      data: { 
        given_name: givenName,
        email: email,
        alt_email: altEmail
      },
    });

    // Update Firebase Authentication email
    // First, try to find the Firebase user with the current email
    try {
      const firebaseUser = await admin.auth().getUserByEmail(currentEmail || updatedUser.email);
      
      // If we found the user, update their email
      await admin.auth().updateUser(firebaseUser.uid, {
        email: email,
        // Don't change email verified status
        emailVerified: firebaseUser.emailVerified
      });
      
      console.log('Firebase email updated successfully');
    } catch (firebaseError) {
      console.error('Error updating Firebase email:', firebaseError);
      // Don't fail the operation if Firebase update fails
      // The user can still use password reset to fix this later
    }

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        given_name: updatedUser.given_name,
        email: updatedUser.email,
        alt_email: updatedUser.alt_email
      }
    });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ error: 'Failed to update user information' });
  }
} 