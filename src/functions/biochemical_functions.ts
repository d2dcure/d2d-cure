// biochemical_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Imports
import * as aa from "@/constants/biochemical"


interface TagInfo {
	text: string,
	//color: string,
	color: "default" | "primary" | "warning" | "danger",
	desc: string
}


export function compareAAsAndReturnTags(aa1: string, aa2: string): TagInfo[] {
	const tags: TagInfo[] = [];
	if (aa1 == aa2) {
		tags.push({
				text: "WT",
				color: "default",
				desc: "This is the WT enzyme."
			});
		return tags;
	}
	if (aa.negativeAAs.includes(aa1)) {
		if (aa.negativeAAs.includes(aa2)) {
			tags.push({
				text: "negative-to-negative",
				color: "primary",
				desc: "This is likely to be a favorable substitution"
			});
		}
	}

	return tags;
}