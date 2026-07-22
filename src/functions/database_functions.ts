// database_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Imports
// TODO: Whenever new enzymes are added to the D2D Network, a new Prisma client
// singleton needs to be created and imported here.
import prismaAbcD from "../../prismaAbcDClient";
import prismaBglB from "../../prismaBglBClient";

// Look up and retrieve the Prisma client for the proper database.
// TODO: Whenever a new enzyme is added, it needs to be added to this switch
// statement.
export function getClient(enzyme: string) {
	switch (enzyme) {
		case "AbcD":
			return prismaAbcD;
		case "BglB":
			return prismaBglB;
		default:
			return prismaBglB;
	}
}