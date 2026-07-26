// biochemical_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Imports
import * as aa from "@/constants/biochemical"


//Interfaces

// Colors used for variant tags.
// Color must be one of the given values, because the Chip component only
// accepts a limited number of strings as values.
// Use "primary" for similar subsitutions and "warning" and "danger" for
// dissimilar substitutions, depending on severity.
interface TagInfo {
	text: string,
	color: "default" | "primary" | "warning" | "danger",
	desc: string
}


// Helper functions

// Return the fullname of the residue from the 1-letter code.
export function getNameFromOneLetterCode(code: string): string {
	switch ( code ) {
		case 'A':
			return "Alanine";
		case 'C':
			return "Cysteine";
		case 'D':
			return "Aspartate";
		case 'E':
			return "Glutamate";
		case 'F':
			return "Phenylalanine";
		case 'G':
			return "Glycine";
		case 'H':
			return "Histidine";
		case 'I':
			return "Isoleucine";
		case 'K':
			return "Lysine";
		case 'L':
			return "Leucine";
		case 'M':
			return "Methionine";
		case 'N':
			return "Asparagine";
		case 'O':
			return "Pyrrolysine";
		case 'P':
			return "Proline";
		case 'Q':
			return "Glutamine";
		case 'R':
			return "Arginine";
		case 'S':
			return "Serine";
		case 'T':
			return "Threonine";
		case 'U':
			return "Selenocysteine";
		case 'V':
			return "Valine";
		case 'W':
			return "Tryptophan";
		case 'Y':
			return "Tyrosine";
		default:
			return "Unnatrual";
	}
}

// Return the properties of the residue from the 1-letter code.
export function getPropertiesFromOneLetterCode(code: string): string[] {
	const properties: string[] = [];
	if (aa.negativeAAs.includes(code)) { properties.push("negative (basic)"); }
	if (aa.positiveAAs.includes(code)) { properties.push("positive (acidic)"); }
	if (aa.polarChargedAAs.includes(code)) { properties.push("charged polar"); }
	if (aa.polarUnchargedAAs.includes(code)) { properties.push("uncharged polar"); }
	if (aa.hydrophilicAAs.includes(code)) { properties.push("hydrophilic"); }
	if (aa.hydrophobicAAs.includes(code)) { properties.push("hydrophobic"); }
	if (aa.aromaticAAs.includes(code)) { properties.push("aromatic"); }
	if (aa.aliphaticAAs.includes(code)) { properties.push("aliphatic"); }
	if (aa.smallAAs.includes(code)) { properties.push("small"); }
	if (aa.bulkyAAs.includes(code)) { properties.push("bulky"); }
	if (aa.helixBreakingAAs.includes(code)) { properties.push("helix-breaking"); }
	return properties;
}


// Compares the chemical properties of the side chains of two amino acid
// residues and returns a set of information to be used in making informational
// tags on other pages. 
export function compareAAsAndReturnTags(aa1: string, aa2: string): TagInfo[] {
	const tags: TagInfo[] = [];
	const good_text = "This is likely to be a favorable substitution, ";
	const maybe_text = "This may be an unfavorable substitution, ";
	const bad_text = "This is likely to be an unfavorable substitution, ";

	// If the two residues are the same, this is the WT enzyme.
	if (aa1 == aa2) {
		tags.push({
				text: "WT",
				color: "default",
				desc: "This is the WT enzyme."
			});
		return tags;
	}

	// Compare signs of charge.
	if (aa.negativeAAs.includes(aa1)) {
		if (aa.negativeAAs.includes(aa2)) {
			tags.push({
				text: "negative-to-negative",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are basic at neutral pH."
			});
		}
		if (aa.positiveAAs.includes(aa2)) {
			tags.push({
				text: "negative-to-positive",
				color: "danger",
				desc: bad_text +
						"as the WT residue is basic at neutral pH " +
						"but the variant residue is acidic."
			});
		}
	}
	if (aa.positiveAAs.includes(aa1)) {
		if (aa.positiveAAs.includes(aa2)) {
			tags.push({
				text: "positive-to-positive",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are acidic at neutral pH."
			});
		}
		if (aa.negativeAAs.includes(aa2)) {
			tags.push({
				text: "positive-to-negative",
				color: "danger",
				desc: bad_text +
						"as the WT residue is acidic at neutral pH " +
						"but the variant residue is basic."
			});
		}
	}

	// Compare presence of charge.
	if (aa.polarChargedAAs.includes(aa1)) {
		if (aa.polarChargedAAs.includes(aa2)) {
			tags.push({
				text: "charged-to-charged",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are charged at neutral pH."
			});
		}
		if (aa.polarUnchargedAAs.includes(aa2)) {
			tags.push({
				text: "charged-to-uncharged",
				color: "warning",
				desc: maybe_text +
						"as the WT residue is charged at neutral pH " +
						"but the variant residue is neutral."
			});
		}
	}
	if (aa.polarUnchargedAAs.includes(aa1)) {
		if (aa.polarUnchargedAAs.includes(aa2)) {
			tags.push({
				text: "uncharged-to-uncharged",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are neutral at neutral pH."
			});
		}
		if (aa.polarChargedAAs.includes(aa2)) {
			tags.push({
				text: "uncharged-to-charged",
				color: "warning",
				desc: maybe_text +
						"as the WT residue is neutral at neutral pH " +
						"but the variant residue is charged."
			});
		}
	}

	// Compare hydrophilicity.
	if (aa.hydrophilicAAs.includes(aa1)) {
		if (aa.hydrophilicAAs.includes(aa2)) {
			tags.push({
				text: "hydrophilic-to-hydrophilic",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are hydrophilic."
			});
		}
		if (aa.hydrophobicAAs.includes(aa2)) {
			tags.push({
				text: "hydrophilic-to-hydrophobic",
				color: "danger",
				desc: bad_text +
						"as the WT residue is hydrophilic " +
						"but the variant residue is hydrophobic."
			});
		}
	}
	if (aa.hydrophobicAAs.includes(aa1)) {
		if (aa.hydrophobicAAs.includes(aa2)) {
			tags.push({
				text: "hydrophobic-to-hydrophobic",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are hydrophobic."
			});
		}
		if (aa.hydrophilicAAs.includes(aa2)) {
			tags.push({
				text: "hydrophobic-to-hydrophilic",
				color: "danger",
				desc: bad_text +
						"as the WT residue is hydrophobic " +
						"but the variant residue is hydrophilic."
			});
		}
	}

	// Compare aromaticity.
	if (aa.aromaticAAs.includes(aa1)) {
		if (aa.aromaticAAs.includes(aa2)) {
			tags.push({
				text: "aromatic-to-aromatic",
				color: "primary",
				desc: good_text +
						"as both WT and variant residues are aromatic. " +
						"Aromatic rings are often involved in pi-stacking interactions."
			});
		}
		if (aa.aliphaticAAs.includes(aa2)) {
			tags.push({
				text: "aromatic-to-aliphatic",
				color: "warning",
				desc: maybe_text +
						"as the WT residue is aromatic " +
						"but the variant residue is aliphatic (does not contain an aromatic ring system). " +
						"Aromatic rings are often involved in pi-stacking interactions."
			});
		}
	}
	if (aa.aliphaticAAs.includes(aa1)) {
		if (aa.aromaticAAs.includes(aa2)) {
			tags.push({
				text: "aliphatic-to-aromatic",
				color: "warning",
				desc: maybe_text +
						"as the WT residue is aliphatic (does not contain an aromatic ring system) " +
						"but the variant residue is aromatic."
			});
		}
	}

	// Compare size.
	if (aa.smallAAs.includes(aa1)) {
		if (aa.bulkyAAs.includes(aa2)) {
			tags.push({
				text: "small-to-bulky",
				color: "warning",
				desc: maybe_text +
						"as the variant residue is much larger than the WT residue."
			});
		}
	}
	if (aa.bulkyAAs.includes(aa1)) {
		if (aa.smallAAs.includes(aa2)) {
			tags.push({
				text: "bulky-to-small",
				color: "warning",
				desc: maybe_text +
						`as the variant residue is much smaller than the WT residue and might create a "hole".`
			});
		}
	}

	// Compare changes of helix-breaking residue.
	if ((aa.helixBreakingAAs.includes(aa1)) || (aa.helixBreakingAAs.includes(aa2))) {
		tags.push({
			text: "helix-breaking?",
			color: "warning",
			desc: maybe_text +
					`as alanine and proline residues often are used to "break" helices.`
		});
	}

	return tags;
}