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
  wt_id: string | null;
}

function prepData(data:string[]) : string[][]{
  const finalData = new Array();
  finalData.push(["Row", "1", "2", "3"]);
  for (let i = 0; i < data.length; i = i + 7) {
    const temp = new Array();
    for (let j = i; j < i + 7; j = j + 2) {
      temp.push(data[j]);
    }
    finalData.push(temp);
  }
  return finalData;
}

function KineticTable(props:KineticTableProps) {
  const default2d = [[]];
  const [WT, setWT] = useState<string[][]>(default2d);
  const [WTdata, setWTdata] = useState<string[][]>(default2d);
  const [data, setData] = useState<any>();
  const [ddata, set2ddata] = useState<string[][]>(default2d);
  const [renderStatus, setRenderStatus] = useState<boolean>(false);
  
  const displayKineticData = async () => {
    try {
      console.log(props);
        // const response = await fetch('/api/getKineticData');
        const response = await axios.get('/api/getKineticData', 
          {params: {
            id: props.id
          }}
        )

        const wt = await axios.get('/api/getKineticData', 
          {params: {
            id: props.wt_id
          }}
        )

        
        console.log(JSON.stringify(response));

        const data = response.data
        setData(data);

        const buffer64 = Buffer.from(data.cell_data.data, 'binary').toString('utf8').slice(4, -3).split(';');

        const parsedData = buffer64.map(dataParse);
        console.log(parsedData);
        const finalData = prepData(parsedData);

        console.log(buffer64);
        console.log(parsedData);
        set2ddata(finalData);

        const data_wt = wt.data
        setWT(data_wt);

        const buffer64wt = Buffer.from(data_wt.cell_data.data, 'binary').toString('utf8').slice(4, -3).split(';');

        const parsedDatawt = buffer64wt.map(dataParse);
        console.log(parsedData);
        const finalDataWt = prepData(parsedDatawt);

        console.log(buffer64);
        console.log(parsedData);
        set2ddata(finalData);
        setWTdata(finalDataWt);


    } catch (error) {
        console.error('Error uploading file:', error);
    }
  }

  useEffect(() => {
    displayKineticData();
  }, []);

  return (
    <div className="table-container">
      <Table data={ddata} />
      <MetaData data={data} />
      <Table data={WTdata} />
      <MetaData data={WT} />
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

