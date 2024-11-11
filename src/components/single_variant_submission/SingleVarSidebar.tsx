import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import { Button, Textarea, Tooltip } from '@nextui-org/react';

interface SidebarProps {
  entryData: any;
  updateEntryData: (newData: any) => void;
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

const SingleVarSidebar: React.FC<SidebarProps> = ({ entryData, updateEntryData }) => {
  const { user } = useUser();
  const [oligosData, setOligosData] = useState<any[]>([]);
  const [possibleTeammates, setPossibleTeammates] = useState<any[]>([]);
  const [teammate1, setTeammate1] = useState<string | null>(entryData.teammate);
  const [teammate2, setTeammate2] = useState<string | null>(entryData.teammate2);
  const [teammate3, setTeammate3] = useState<string | null>(entryData.teammate3);
  const [comment, setComment] = useState<string>(entryData.comments || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');

  const foundOligo = oligosData.find(
    (oligo) => oligo.variant === `${entryData.resid}${entryData.resnum}${entryData.resmut}`
  );

  const clipboard = useClipboard();

  useEffect(() => {
    setComment(entryData.comments || '');
  }, [entryData.comments]);

  useEffect(() => {
    setTeammate1(entryData.teammate || null);
    setTeammate2(entryData.teammate2 || null);
    setTeammate3(entryData.teammate3 || null);
  }, [entryData]);

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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
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

  const handleSaveTeammates = async () => {
    try {
      const response = await fetch('/api/updateCharacterizationDataTeammates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryData.id,
          teammate: teammate1 || null,
          teammate2: teammate2 || null,
          teammate3: teammate3 || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save teammates');
      }

      alert('Teammates saved successfully!');

      const updatedResponse = await fetch(`/api/getCharacterizationDataEntryFromID?id=${entryData.id}`);
      const updatedData = await updatedResponse.json();
      updateEntryData(updatedData);  
    } catch (error) {
      console.error('Error saving teammates:', error);
      alert('Failed to save teammates.');
    }
  };

  return (
    <div className="flex flex-col pt-5 gap-6">
      {/* Section 1: Database ID, Primer Sequence, Date Created, Plate ID, Institution, Creator */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div>
          <span className="font-medium text-sm">Database ID</span>
          <p className='text-gray-500 text-sm'>{entryData.id}</p>
        </div>

        {foundOligo && (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Primer Sequence</span>
              <Button
                size="sm"
                variant="light"
                isIconOnly
                className="min-w-6 w-6 h-6 p-0 text-gray-400 hover:text-[#06B7DB]"
                onClick={() => clipboard.copy(foundOligo.oligo)}
              >
                {clipboard.copied ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"/>
                  </svg>
                )}
              </Button>
            </div>
            <Tooltip content={clipboard.copied ? "Copied!" : foundOligo.oligo} placement="bottom">
              <p 
                className="break-normal whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#06B7DB] text-sm"
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

      {/* Section 2: Teammates */}
      <div className="space-y-2">
        <span className="font-medium text-sm">Teammate 1</span>
        <select
          value={teammate1 || 'None'}
          onChange={(e) => setTeammate1(e.target.value === 'None' ? null : e.target.value)}
          className="max-w-full bg-gray-50 text-sm"
        >
          <option value="None">None</option>
          {possibleTeammates.map((mate) => (
            <option key={mate.user_name} value={mate.user_name}>
              {mate.given_name} ({mate.user_name})
            </option>
          ))}
        </select>

        <span className="font-medium text-sm">Teammate 2</span>
        <select
          value={teammate2 || 'None'}
          onChange={(e) => setTeammate2(e.target.value === 'None' ? null : e.target.value)}
          className="max-w-full bg-gray-50 text-sm"
        >
          <option value="None">None</option>
          {possibleTeammates.map((mate) => (
            <option key={mate.user_name} value={mate.user_name}>
              {mate.given_name} ({mate.user_name})
            </option>
          ))}
        </select>

        <span className="font-medium text-sm">Teammate 3</span>
        <select
          value={teammate3 || 'None'}
          onChange={(e) => setTeammate3(e.target.value === 'None' ? null : e.target.value)}
          className="max-w-full bg-gray-50 text-sm"
        >
          <option value="None">None</option>
          {possibleTeammates.map((mate) => (
            <option key={mate.user_name} value={mate.user_name}>
              {mate.given_name} ({mate.user_name})
            </option>
          ))}
        </select>

        <Button color="primary" size="sm" className="mt-2 bg-[#06B7DB]" onClick={handleSaveTeammates}>
          Save Teammates
        </Button>
      </div>

      {/* Section 3: Comment */}
      <div>
        <label className="font-medium text-sm">Comment:</label>
        {comment ? (
          <div className="mt-2">
            <div className="bg-gray-50 rounded-lg p-3 relative">
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
