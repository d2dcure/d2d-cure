// formatting_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Helper function to properly display HTML entities.
export function decodeHTML(html:string): string {
	var txt = document.createElement("textarea");
	txt.innerHTML = html;
	return txt.value;
}
