import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';

interface SidebarProps {
  entryData: any;
}

const SingleVarSidebar: React.FC<SidebarProps> = ({ entryData }) => {
  const { user } = useUser();
  const [oligosData, setOligosData] = useState<any[]>([]);
  const [possibleTeammates, setPossibleTeammates] = useState<any[]>([]);
  const [teammate1, setTeammate1] = useState<string>('');
  const [comment, setComment] = useState<string>(entryData.comments || ''); // Local comment state
  const [saving, setSaving] = useState<boolean>(false); // Save button state

  const foundOligo = oligosData.find(
    (oligo) =>
      oligo.variant === `${entryData.resid}${entryData.resnum}${entryData.resmut}`
  );

  // Sync local comment state with entryData.comments whenever it changes
  useEffect(() => {
    setComment(entryData.comments || '');
  }, [entryData.comments]);

  useEffect(() => {
    const fetchOligosData = async () => {
      try {
        const response = await fetch('/api/getOligos');
        const data = await response.json();
        setOligosData(data);
      } catch (error) {
        console.error('Error fetching oligos data:', error);
      }
    };

    const fetchPossibleTeammates = async () => {
      if (user?.pi) {
        const response = await fetch(`/api/getUsersFromPI?pi=${encodeURIComponent(user.pi)}`);
        const data = await response.json();
        setPossibleTeammates(data);
      }
    };

    fetchOligosData();
    fetchPossibleTeammates();
  }, [user]);

  const handleSaveComment = async () => {
    setSaving(true); // Show loading state

    try {
      const response = await fetch('/api/updateCharacterizationDataComment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryData.id,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment');
      }

      alert('Comment saved successfully!');
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Failed to save comment.');
    } finally {
      setSaving(false); // Reset loading state
    }
  };

  return (
    <div className="w-1/4 bg-white p-4 shadow">
      <h1 className="text-2xl font-bold">Variant Information</h1>
      <div className="mt-5 mb-5">
        <p>{entryData.resid}{entryData.resnum}{entryData.resmut}</p>
        {foundOligo && <p>Primer Sequence: {foundOligo.oligo}</p>}
        <p>Database ID: {entryData.id}</p>
        <p>Institution: {entryData.institution}</p>
        <p>Creator: {entryData.creator}</p>

        {/* Teammate Selector */}
        <div>
          <label>Teammate 1:</label>
          <select
            value={teammate1}
            onChange={(e) => setTeammate1(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-100 border rounded"
          >
            <option value="">None</option>
            {possibleTeammates.map((mate, index) => (
              <option key={index} value={mate.user_name}>
                {mate.given_name} ({mate.user_name})
              </option>
            ))}
          </select>
        </div>

        {/* Comments Section */}
        <div className="mt-5">
          <label htmlFor="comment" className="block font-medium">
            Comments:
          </label>
          <textarea
            id="comment"
            value={comment} // Use local state to track changes
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-1 block w-full p-2 bg-gray-100 border rounded"
            placeholder="Enter your comment here..."
          />
          <button
            className={`mt-2 px-4 py-2 text-white rounded ${
              saving ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={handleSaveComment}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleVarSidebar;
