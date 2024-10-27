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

  const foundOligo = oligosData.find(
    (oligo) =>
      oligo.variant === `${entryData.resid}${entryData.resnum}${entryData.resmut}`
  );

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
      if (user?.pi)
      {
        const response = await fetch(`/api/getUsersFromPI?pi=${encodeURIComponent(user.pi)}`); 
        const data = await response.json(); 
        setPossibleTeammates(data); 
      }
    };

    fetchOligosData();
    fetchPossibleTeammates();
  }, [user]);

  return (
    <div className="w-1/4 bg-white p-4 shadow">
      <h1 className="text-2xl font-bold">Variant Information</h1>
      <div className="mt-5 mb-5">
        <p>
          {entryData.resid}
          {entryData.resnum}
          {entryData.resmut}
        </p>
        {foundOligo && <p>Primer Sequence: {foundOligo.oligo}</p>}
        <p>Database ID: {entryData.id}</p>
        <p>Institution: {entryData.institution}</p>
        <p>Creator: {entryData.creator}</p>
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
        {/* Additional teammate selectors if needed */}
      </div>
    </div>
  );
};

export default SingleVarSidebar;
