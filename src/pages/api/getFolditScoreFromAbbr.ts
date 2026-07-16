import prismaEnzymes from "../../../prismaEnzymesClient";

export default async function handler(req: any, res: any) {
	try {
		const data = await prismaEnzymes.generalInfo.findFirst({
			where: {
				abbr: req.body,
			},
		});

		if (data) {
			res.status(200).json(data);
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
}