// biochemical_functions.ts
// Author: Jason W. Labonte
// This file contains helper functions for use in the D2D database website.

// Imports
import * as aa from "@/constants/biochemical"


// Color must be one of the given values, because the Chip component only
// accepts a limited number of strings as values.
// Use "primary" for similar subsitutions and "warning" and "danger" for
// dissimilar substitutions, depending on severity.
interface TagInfo {
	text: string,
	color: "default" | "primary" | "warning" | "danger",
	desc: string
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
						"as both WT and variant residues are aromatic."
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
		if (aa.aliphaticAAs.includes(aa2)) {
			tags.push({
				text: "aliphatic-to-aliphatic",
				color: "default",
				desc: "Both WT and variant residues are aliphatic."
			});
		}
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



	return tags;
}