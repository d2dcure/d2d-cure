import { getClient } from "../../functions/database_functions";
//import prismaBglB from "../../../prismaBglBClient";

export default async function handler(req:any, res:any) {
	const enzyme = (req.query.enzyme as string) || '';
	if (enzyme == '') {
		return res.status(400).json({ error: "Enzyme is required." });
	}
	const client = getClient(enzyme);
	if (!client) {
		return res.status(400).json({ error: "Enzyme does not have a database." });
	}
	try {
		const data = await client.characterizationData.findMany();
		res.status(200).json(data);
	} catch (error) {
		console.error('Request error', error);
		res.status(500).json({ error: 'Error fetching characterization data' });
	}
}