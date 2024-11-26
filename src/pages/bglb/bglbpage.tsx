import React, { useState, ChangeEvent, useEffect } from 'react';
import './styles.css';
import s3 from '../../../s3config';

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

interface BglbProps {
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
  return finalData;
}

async function prepImage(gelImageName: string) {
  const fileType = gelImageName.split(".")[1];

  const gel_params = {
    Bucket: "d2dcurebucket",
    Key: gelImageName,
  };

  return new Promise<string>((resolve, reject) => {
    s3.getObject(gel_params, function (err, data) {
      if (err) {
        console.log("Error fetching object: ", err);
        reject(err);
        return;
      }

      const b64 = data.Body?.toString('base64');
      const mimeType = `image/${fileType}`; // e.g., image/png
      const gelImageURL = `data:${mimeType};base64,${b64}`;
      
      resolve(gelImageURL); // Return the base64 Data URL
    });
  });
}

function BglBPage(props:BglbProps) {
  const default2d = [[]];
  const [wtKineticData, setWTKineticData] = useState<any>();
  const [wtKineticTable, setWTKineticTable] = useState<string[][]>(default2d);
  const [kineticData, setKineticData] = useState<any>();
  const [kineticTable, setKineticTable] = useState<string[][]>(default2d);
  const [wtTempData, setWTTempData] =  useState<any>();
  const [wtTempTable, setWTTempTable] = useState<string[][]>(default2d);
  const [tempData, setTempData] = useState<any>();
  const [tempTable, setTempTable] = useState<string[][]>(default2d);

  const [kineticPlotImage, setKineticPlotImage] = useState <string>();
  const [tempPlotImage, setTempPlotImage] = useState <string>();
  const [gelImage, setGelImage] = useState <any>();

  
  const displayBglb = async () => {
    try {
      const response = await fetch(`/api/getCharacterizationDataEntryFromID?id=${props.id}`);
      const data = await response.json();

      const gelFileName = data.gel_filename

      if (gelFileName){ 
        const gelImageKey = "gel-images/" + gelFileName;
        // Wait for prepImage to resolve and set the gel image
        const gelImageURL = await prepImage(gelImageKey);
        setGelImage(gelImageURL)
      }

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
      for (let i = 0; i < kineticDataList.length; i++) {
        const kineticData = kineticDataList[i];
        if (kineticData.variant === "WT") {
          setWTKineticData(kineticData);
          setWTKineticTable(parseData(kineticData));
        } else {
          setKineticData(kineticData);
          setKineticTable(parseData(kineticData));
          
          const kineticPlotFilename = kineticData.plot_filename;
          if (kineticPlotFilename) {
            const kineticPlotFilekey = "kinetic_assays/plots/" + kineticPlotFilename
            const kineticPlotURL = await prepImage(kineticPlotFilekey);
            setKineticPlotImage(kineticPlotURL)
          }
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
        if (tempData.id !== tempRawId) {
          setWTTempData(tempData);
          setWTTempTable(parseData(tempData));
        } else {
          setTempData(tempData);
          setTempTable(parseData(tempData));
          const tempPlotFileName = tempData.plot_filename
          if (tempPlotFileName) {
            
            const tempPlotFileKey = "temp/" + tempData.plot_filename;
            console.log(tempPlotFileName)
            const tempPlotURL = await prepImage(tempPlotFileKey);
            setTempPlotImage(tempPlotURL);
          }
        }
      }
    } catch (error) {
        console.error('Error uploading file:', error);
    }
  }

  useEffect(() => {
    displayBglb();
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
      <img src = {gelImage}></img>
      <img src = {kineticPlotImage}></img>
      <img src = {tempPlotImage}></img>

    </div>
  );
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

export default BglBPage;

