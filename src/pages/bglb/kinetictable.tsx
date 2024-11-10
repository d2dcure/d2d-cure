import React, { useState, ChangeEvent, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';
import './styles.css';
import { useRouter } from 'next/router';

import { fontString } from 'chart.js/helpers';
import { parse } from 'path';

const MetaData: React.FC<{ data: any }> = ({ data }) => {
  if (data == null) {
    return <div></div>;
  }
  return (
    <div className="meta-data">
      <strong>Yield:</strong> {data.yield}
      <br />
      <strong>Assayed on:</strong> {data.assay_date} by {data.user_name}
      <br />
      <strong>Purified on:</strong> {data.purification_date}
      <br />
      <strong>Dilution:</strong> {data.dilution}
    </div>
  );
};

const Table: React.FC<TableProps> = ({ data }) => {
  if (data.length === 0) return null;

  const headers = data[0];
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((rowData, index) => (
            <tr key={index}>
              {rowData.map((item, idx) => (
                <td key={idx}>{item}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface TableProps {
  data: string[][];
}

interface KineticTableProps {
  id: string | null;

}

function parseData(data:any) : string [][] {
  const buffer64 = Buffer.from(data.cell_data, 'binary').toString('utf8').slice(4, -3).split(';');
  const parsedData = buffer64.map(dataParse);
  const finalData = new Array();
  finalData.push(["Row", "1", "2", "3"]);
  for (let i = 0; i < parsedData.length; i = i + 7) {
    const temp = new Array();
    for (let j = i; j < i + 7; j = j + 2) {
      temp.push(parsedData[j]);
    }
    finalData.push(temp);
  }
  console.log(finalData);
  return finalData;
}

function KineticTable(props:KineticTableProps) {
  const default2d = [[]];
  const [wtKineticData, setWTKineticData] = useState<any>();
  const [wtKineticTable, setWTKineticTable] = useState<string[][]>(default2d);
  const [kineticData, setKineticData] = useState<any>();
  const [kineticTable, setKineticTable] = useState<string[][]>(default2d);
  const [wtTempData, setWTTempData] =  useState<any>();
  const [wtTempTable, setWTTempTable] = useState<string[][]>(default2d);
  const [tempData, setTempData] = useState<any>();
  const [tempTable, setTempTable] = useState<string[][]>(default2d);

  
  const displayKineticData = async () => {
    try {
      console.log(props);
      const response = await fetch(`/api/getCharacterizationDataEntryFromID?id=${props.id}`);
      const data = await response.json();

        // const response = await fetch('/api/getKineticData');
      const kineticRawId = data.raw_data_id;
      const wtKineticRawId = data.WT_raw_data_id;
      const kineticIds = [kineticRawId, wtKineticRawId]

      const kineticDataResponse = await fetch('/api/getKineticRawDataFromIDs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: kineticIds }),
      });
      const kineticDataList = await kineticDataResponse.json();
      // console.log(kineticData)
      for (let i = 0; i < kineticDataList.length; i++) {
        const kineticData = kineticDataList[i];
        if (kineticData.variant === "WT") {
          setWTKineticData(kineticData);
          setWTKineticTable(parseData(kineticData));
        } else {
          setKineticData(kineticData);
          setKineticTable(parseData(kineticData));
        }
      }
      

      const tempRawId = data.temp_raw_data_id;
      const wtTempRawId = data.WT_temp_raw_data_id;
      const tempIds = [tempRawId, wtTempRawId]
      const tempDataResponse = await fetch('/api/getTempRawDataFromIDs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: tempIds }),
      });

      const tempDataList = await tempDataResponse.json();
      for (let i = 0; i < tempDataList.length; i++) {
        const tempData = tempDataList[i];
        if (tempData.id === tempRawId) {
          setWTTempData(tempData);
          setWTTempTable(parseData(tempData));
        } else {
          setTempData(tempData);
          setTempTable(parseData(tempData));
        }
      }

    } catch (error) {
        console.error('Error uploading file:', error);
    }
  }

  useEffect(() => {
    displayKineticData();
  }, []);

  return (
    <div className="table-container">
      <Table data={kineticTable} />
      <MetaData data={kineticData} />
      <Table data={wtKineticTable} />
      <MetaData data={wtKineticData} />
      <div> TEMPERATURE DATA</div>
      <Table data={tempTable} />
      <MetaData data={tempData} />
      <Table data={wtTempTable} />
      <MetaData data={wtTempData} />
    </div>
  );
}

function displayMetaData(data:any) {
  return <div>

    {data.yeild} {data.dilution}
  </div>
}

function dataParse(s:string) {
  let start = -1;
  let end = -1;

  for (let i = 0; i < s.length; i++) {
    if (s[i] == '"' ) {
      start = i;
      break;
    }
  }
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] == '"') {
      end = i;
      break;
    }
  }
  if (start != -1) {
    return s.slice(start + 1, end)
  }
  return ""
}

export default KineticTable;

