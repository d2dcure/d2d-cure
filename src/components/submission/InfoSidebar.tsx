import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import { compareAAsAndReturnTags } from "@/functions/biochemical_functions";
import { Button, Chip, Link, Textarea, Tooltip } from '@nextui-org/react';
import { format } from 'date-fns';


interface SidebarProps {
	enzyme: string;
	entryData: any;
	updateEntryData: (newData: any) => void;
}

interface EnzymeGeneralInfo {
	cat_residues: string;
}

interface SequenceData {
	Rosetta_resnum: number;
	PDBresnum: string;
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

const SingleVarSidebar: React.FC<SidebarProps> = (
	{ enzyme, entryData, updateEntryData }
) => {
  const { user } = useUser();
  const [oligosData, setOligosData] = useState<any[]>([]);
  const [enzymeInfo, setEnzymeInfo] = useState<EnzymeGeneralInfo>();
  const [sequence, setSequence] = useState<SequenceData[]>([]);
  const [possibleTeammates, setPossibleTeammates] = useState<any[]>([]);
  const [teammate1, setTeammate1] = useState<string | null>(entryData.teammate);
  const [teammate2, setTeammate2] = useState<string | null>(entryData.teammate2);
  const [teammate3, setTeammate3] = useState<string | null>(entryData.teammate3);
  const [comment, setComment] = useState<string>(entryData.comments || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);

  const foundOligo = 
  		(oligosData.length) ?
		oligosData.find((oligo) => oligo.variant === `${entryData.resid}${entryData.resnum}${entryData.resmut}`) :
		null;

  const clipboard = useClipboard();

  useEffect(() => {
    setComment(entryData.comments || '');
    setEditMode(false);
    setNewComment('');
  }, [entryData.comments]);

  useEffect(() => {
    setTeammate1(entryData.teammate || null);
    setTeammate2(entryData.teammate2 || null);
    setTeammate3(entryData.teammate3 || null);
  }, [entryData]);

  useEffect(() => {
    const fetchOligosData = async () => {
      try {
        const response = await fetch(`/api/getOligos?enzyme=${enzyme}`);
        const data = await response.json();
        setOligosData(data);
      } catch (error) {
        console.error('Error fetching oligos data:', error);
      }
    };

	const fetchEnzymeData = async () => {
		try {
		const response = await fetch(`/api/getEnzymeGeneralInfo?enzyme=${enzyme}`);
			if (response.ok) {
				const info = await response.json();
				setEnzymeInfo(info);
			}
		} catch (error) {
        	console.error("Error fetching enzyme data:", error);
		}
	};

	const fetchSequence = async () => {
		try {
		const response = await fetch(`/api/getSequenceData?enzyme=${enzyme}`);
			if (response.ok) {
				const sequence = await response.json();
				setSequence(sequence);
			}
		} catch (error) {
        	console.error("Error fetching sequence data:", error);
		}
	};

    const fetchPossibleTeammates = async () => {
		let pi = user?.pi;
		if (user?.status === "professor") { pi = user?.given_name; }
      if (pi) {
        const response = await fetch(`/api/getUsersFromPI?pi=${encodeURIComponent(pi)}`);
        const data = await response.json();
        setPossibleTeammates(data);
      }
    };

    fetchOligosData();
	fetchEnzymeData();
	fetchSequence();
    fetchPossibleTeammates();
  }, [enzyme, user]);

  	const isCatalyticResidue = (): boolean => {
		if (entryData.resnum && enzymeInfo?.cat_residues) {
			const residue_data = sequence.find(res => res.Rosetta_resnum === entryData.resnum);
			const pdb_resnum = (residue_data) ? residue_data.PDBresnum : '';
			return enzymeInfo.cat_residues.split(", ").map(res => res.slice(1)).includes(pdb_resnum);
		}
		return false;
	};

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

  const handleEditComment = () => {
    setNewComment(comment);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setNewComment('');
    setEditMode(false);
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
			enzyme: enzyme,
          id: entryData.id,
          comment: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment');
      }

      setComment(newComment);
      setNewComment('');
      setEditMode(false);
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
			enzyme: enzyme,
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

      const updatedResponse = await fetch(`/api/getCharacterizationDataEntryFromID?enzyme=${enzyme}&id=${entryData.id}`);
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
          <p className='text-gray-500 text-sm'>{enzyme}-{entryData.id}</p>
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
			<span className="font-medium text-sm">Related Variants</span>
			<p className="text-blue-500 text-sm">
				<Link
					isExternal
					showAnchorIcon
					href={`/database/characterization_data/${enzyme}?highlight=${entryData.resnum}`}
				>
					Search database
				</Link>
			</p>
		</div>

        <div>
          <span className="font-medium text-sm">Tags</span>
		  <div className="flex flex-wrap gap-2">
			{isCatalyticResidue() && (
			<Tooltip
				content="This is one of the known catalytic residues."
			>
				<Chip
					
					size="sm"
					color="danger"
				>
					catalytic
				</Chip>
			</Tooltip>
			)}
			{compareAAsAndReturnTags(entryData.resid, entryData.resmut).map((tag, index) => (
			<Tooltip
				key={index}
				content={tag.desc}
			>
				<Chip
					
					size="sm"
					color={tag.color}
				>
						{tag.text}
				</Chip>
			</Tooltip>
			))}
		  </div>
        </div>

        <div>
          <span className="font-medium text-sm">Date Created</span>
          <p className='text-gray-500 text-sm'>{format(entryData.created_date, "yyyy.MM.dd")}</p>
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
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div className="space-y-2">
          <div>
            <span className="font-medium text-sm">Teammate 1</span>
            <select
              value={teammate1 || 'None'}
              onChange={(e) => setTeammate1(e.target.value === 'None' ? null : e.target.value)}
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#06B7DB] focus:border-transparent"
            >
              <option value="None">None</option>
              {possibleTeammates.map((mate) => (
                <option key={mate.user_name} value={mate.user_name}>
                  {mate.given_name} ({mate.user_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="font-medium text-sm">Teammate 2</span>
            <select
              value={teammate2 || 'None'}
              onChange={(e) => setTeammate2(e.target.value === 'None' ? null : e.target.value)}
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#06B7DB] focus:border-transparent"
            >
              <option value="None">None</option>
              {possibleTeammates.map((mate) => (
                <option key={mate.user_name} value={mate.user_name}>
                  {mate.given_name} ({mate.user_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="font-medium text-sm">Teammate 3</span>
            <select
              value={teammate3 || 'None'}
              onChange={(e) => setTeammate3(e.target.value === 'None' ? null : e.target.value)}
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#06B7DB] focus:border-transparent"
            >
              <option value="None">None</option>
              {possibleTeammates.map((mate) => (
                <option key={mate.user_name} value={mate.user_name}>
                  {mate.given_name} ({mate.user_name})
                </option>
              ))}
            </select>
          </div>

          <Button 
            color="primary" 
            size="sm" 
            className="w-full mt-2 bg-[#06B7DB]" 
            onClick={handleSaveTeammates}
          >
            Save Teammates
          </Button>
        </div>
      </div>

      {/* Section 3: Comment */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div>
          <span className="font-medium text-sm">Comments</span>
          {comment && !editMode ? (
            <div className="mt-2">
              <div className="bg-white rounded-lg p-3 relative">
                <p className="text-sm whitespace-pre-wrap">{comment}</p>
                {/*<div className="text-[11px] text-gray-400 mt-2">
                  Last updated by {user?.user_name} • {formatTimestamp(new Date())}
                </div>*/}
              </div>
              <Button
                color="primary"
                size="sm"
                variant="light"
                className="mt-2 text-[#06B7DB]"
                onClick={handleEditComment}
              >
                Edit Comment
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {!comment && !editMode && (
                <p className="text-sm text-gray-400 italic">No comment added yet</p>
              )}
              <div className="relative">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={editMode ? "Edit comment..." : "Add a comment..."}
                  maxLength={250}
                  minRows={2}
                  maxRows={4}
                  classNames={{
                    input: "resize-none py-1 text-sm min-h-0",
                    base: "w-full min-h-0",
                    inputWrapper: "min-h-0 bg-white"
                  }}
                />
                <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">
                  {newComment.length}/250
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  size="sm"
                  className="flex-1 bg-[#06B7DB]"
                  onClick={handleSaveComment}
                  isLoading={saving}
                  isDisabled={!newComment.trim()}
                >
                  {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Comment'}
                </Button>
                {editMode && (
                  <Button
                    size="sm"
                    variant="flat"
                    className="flex-1"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
		  	<small>(Please sign your comments with your initials; <i>e.g.</i>, &ldquo;~ABC&rdquo;.)</small>
        </div>
	  </div>
    </div>
  );
};

export default SingleVarSidebar;
