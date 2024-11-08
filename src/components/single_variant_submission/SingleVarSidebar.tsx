import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import { Button, Textarea, Card, Tooltip } from '@nextui-org/react';

interface SidebarProps {
  entryData: any;
}

const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
};

const renderCell = (item: any, columnKey: string) => {
  switch (columnKey) {
    case 'actions':
      return (
        <div className="flex gap-2">
          {/* Add your action buttons here */}
          <Button size="sm">Edit</Button>
          <Button size="sm">Delete</Button>
        </div>
      );
    default:
      return item[columnKey];
  }
};

const SingleVarSidebar: React.FC<SidebarProps> = ({ entryData }) => {
  const { user } = useUser();
  const [oligosData, setOligosData] = useState<any[]>([]);
  const [possibleTeammates, setPossibleTeammates] = useState<any[]>([]);
  const [teammate1, setTeammate1] = useState<string>('');
  const [comment, setComment] = useState<string>(entryData.comments || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');

  const foundOligo = oligosData.find(
    (oligo) =>
      oligo.variant === `${entryData.resid}${entryData.resnum}${entryData.resmut}`
  );

  const clipboard = useClipboard();

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

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleSaveComment = async () => {
    if (!newComment.trim()) return;
    setSaving(true);

    try {
      const response = await fetch('/api/updateCharacterizationDataComment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryData.id,
          comment: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment');
      }

      setComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Failed to save comment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col pt-5 gap-6">

{/* <span className="font-medium -mb-4 text-sm">Details:</span> */}

      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div>
          <span className="font-medium text-sm">Database ID</span>
          <p className='text-gray-500 text-sm'>{entryData.id}</p>
        </div>

        {foundOligo && (
          <div>
            <span className="font-medium text-sm">Primer Sequence</span>
            <Tooltip 
              content={clipboard.copied ? "Copied!" : foundOligo.oligo} 
              placement="bottom"
            >
              <p 
                className="break-normal whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-blue-500 text-sm"
                onClick={() => clipboard.copy(foundOligo.oligo)}
                title="Click to copy"
              >
                {foundOligo.oligo}
              </p>
            </Tooltip>
          </div>
        )}

        <div>
          <span className="font-medium text-sm">Date Created</span>
          <p className='text-gray-500 text-sm'>{new Date().toLocaleDateString()}</p>
        </div>

        <div>
          <span className="font-medium text-sm">Plate ID</span>
          <p className='text-gray-500 text-sm'>{entryData.plateId || '0000000000'}</p>
        </div>

        <div>
          <span className="font-medium text-sm">Institution</span>
          <p className='text-gray-500 text-sm'>{entryData.institution}</p>
        </div>

        <div>
          <span className="font-medium text-sm">Creator</span>
          <p className='text-gray-500 text-sm'>{entryData.creator}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm">Teammate 1:</label>
        <select
          value={teammate1}
          onChange={(e) => setTeammate1(e.target.value)}
          className="mt-1 block w-full p-2 bg-gray-50 rounded text-sm"
        >
          <option value="">None</option>
          {possibleTeammates.map((mate, index) => (
            <option key={index} value={mate.user_name}>
              {mate.given_name} ({mate.user_name})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-medium text-sm">Comment:</label>
        {comment ? (
          <div className="mt-2">
            <div className="bg-gray-50 rounded-lg p-3 relative">
              <div className="absolute w-0 h-0 border-8 border-transparent border-b-gray-50 -top-4 left-4"></div>
              <p className="text-sm">{comment}</p>
              <div className="text-[11px] text-gray-400 mt-2">
                Last updated by {entryData.creator} • {formatTimestamp(new Date())}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic mt-1">No comment added yet</p>
        )}

        <div className="mt-2 flex gap-1">
          <div className="flex-1 relative">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Update comment..."
              maxLength={100}
              minRows={1}
              maxRows={3}
              classNames={{
                input: "resize-none py-1 text-sm min-h-0",
                base: "w-full min-h-0",
                inputWrapper: "min-h-0 bg-gray-50"
              }}
            />
            <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">
              {newComment.length}/100
            </span>
          </div>
          <Button
            color="primary"
            size="sm"
            className="bg-[#06B7DB] h-[42px] -pl-1 min-w-[40px] px-1"
            onClick={handleSaveComment}
            isLoading={saving}
            isDisabled={!newComment.trim()}
          >
            {saving ? '...' : (
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                className="rotate-45"
              >
                <path 
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SingleVarSidebar;
