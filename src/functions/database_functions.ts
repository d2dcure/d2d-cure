// database_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Imports
// TODO: Whenever new enzymes are added to the D2D Network, a new Prisma client
// singleton needs to be created and imported here.
import prismaAbcD from "../../prismaAbcDClient";
import prismaBglB from "../../prismaBglBClient";
import { DefaultPathway, BglBPathway } from "@/components/enzyme_information/pathways"
import { DefaultMechanism, BglBMechanism } from "@/components/enzyme_information/mechanisms"
import { DefaultAssay, BglBAssay } from "@/components/enzyme_information/assays"

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


export function getPathwayInfo(enzyme: string) {
	switch (enzyme) {
		case "BglB":
			return BglBPathway;
		default:
			return DefaultPathway;
	}
}


export function getMechanismInfo(enzyme: string) {
	switch (enzyme) {
		case "BglB":
			return BglBMechanism;
		default:
			return DefaultMechanism;
	}
}


export function getAssayInfo(enzyme: string) {
	switch (enzyme) {
		case "BglB":
			return BglBAssay;
		default:
			return DefaultAssay;
	}
}