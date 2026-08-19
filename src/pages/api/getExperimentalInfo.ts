import prismaEnzymes from "../../../prismaEnzymesClient";

export default async function handler(req: any, res: any) {
	if (req.method === 'GET') {
		const exp_id = (req.query.exp_id as string) || '';
		try {
			const info = await prismaEnzymes.experimentalInfo.findUnique({
				where: {
					id: parseInt(exp_id),
				},
			});

			if (info) {
				return res.status(200).json(info);
			} else {
				res.status(404).json({
					error: "Experimental info data not found."
				});
			}
		} catch (error) {
			console.error("Request error", error);
			res.status(500).json({
				error: "Error fetching experimental info data entry"
			});
		}
	} else {
		res.setHeader('Allow', ['GET']);
    	res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}