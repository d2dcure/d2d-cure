import prismaUsers from "../../../prismaUsersClient";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, imageFilename } = req.body;

  if (!userId || !imageFilename) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const updatedUser = await prismaUsers.users.update({
      where: { id: parseInt(userId) },
      data: { 
        image_filename: imageFilename 
      },
    });

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        image_filename: updatedUser.image_filename
      }
    });
  } catch (error) {
    console.error('Error updating user profile image:', error);
    res.status(500).json({ error: 'Failed to update profile image' });
  }
} 