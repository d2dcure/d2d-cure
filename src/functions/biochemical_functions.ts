// biochemical_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Imports
import * as aa from "@/constants/biochemical"


interface TagInfo {
	text: string,
	color: string
}


export function compareAAsAndReturnTags(aa1: string, aa2: string): TagInfo[] {
	const tags: TagInfo[] = [];
	if (aa.negativeAAs.includes(aa1)) {
		if (aa.negativeAAs.includes(aa2)) {
			tags.push({text: "negative-to-negative", color: "primary"});
		}
	}

	return tags;
}