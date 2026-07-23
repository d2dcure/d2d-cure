import prismaEnzymes from "../../../prismaEnzymesClient";


export default async function handler(req: any, res: any) {
	if (req.method === 'GET') {
		const enzyme = (req.query.enzyme as string) || '';
		if (enzyme == '') {
			return res.status(400).json({ error: "Enzyme is required." });
		}
		try {
			const info = await prismaEnzymes.generalInfo.findFirst({
				where: {
					abbr: enzyme,
				},
			});

			if (info) {
				return res.status(200).json(info);
			} else {
				res.status(404).json({
					error: "Enzyme general info data not found"
				});
			}
		} catch (error) {
			console.error("Request error", error);
			res.status(500).json({
				error: "Error fetching enzyme general info data entry"
			});
		}
	} else {
		res.setHeader('Allow', ['GET']);
    	res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}