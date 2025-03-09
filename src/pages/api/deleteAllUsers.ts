import type { NextApiRequest, NextApiResponse } from 'next';
import admin from "../../../firebaseAdmin"

const auth = admin.auth();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const listAllUsers = async (nextPageToken?: string) => {
      const result = await auth.listUsers(1000, nextPageToken);
      const userIds = result.users.map(user => user.uid);

      console.log('Fetched user IDs:', userIds);

      // Delete users in batches
      for (const uid of userIds) {
        await auth.deleteUser(uid);
        console.log(`Deleted user: ${uid}`);
      }

      if (result.pageToken) {
        // Continue listing users if there are more
        await listAllUsers(result.pageToken);
      }
    };

    await listAllUsers();
    res.status(200).json({ message: 'All users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
} 