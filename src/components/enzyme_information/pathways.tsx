// pathways.tsx
// Author: Jason W. Labonte
// This file provides information for the biochemical pathways of enzymes in
// the D2D Network.
// They are to be imported as components on other pages.

// Imports
import { Image, Link } from "@nextui-org/react";

export function DefaultPathway() {
	return (
		<div>
			<p className="text-gray-600 text-justify">
				Details coming soon…
			</p>
		</div>
	);
}

export function BglBPathway() {
	return (
		<div className="text-gray-600 text-justify">
			<p className="mb-4">
				<b>Polysaccharides</b> are <u>poly</u>mers of repeating sugar
				(<b><u>saccharide</u></b>) units,
				called <b>monosaccharides</b>.
				Each monosaccharide is connected to another through a{' '}
				<b>glycosidic bond</b>.
			</p>
			<Image
				className="object-center mb-4"
				src="/resources/images/figures/BglB_pathway_fig1.png"
				title="Two monosaccharides connected by a glycosidic bond, indicated by the blue oval."
				alt="A disaccharide is two monosaccharides connected by a glycosidic bond."
				width={250}
			/>
			<p className="mb-4">
				Glycosidic bonds can have multiple <b>stereochemistries</b>,
				the direction that a bond points in three-dimensional space.
				For example, both maltose and cellobiose are made of two glucose
				units, but the glycosidic bond in maltose points down (α) from 
				carbon 1, whereas the same bond in cellobiose points up (β) from 
				carbon 2.
			</p>
			<Image
				className="object-center mb-4"
				src="/resources/images/figures/BglB_pathway_fig2.png"
				title="A comparison of the stereochemistries of maltose and cellobiose."
				alt="Maltose has an (α1→4) linkage; cellobiose has a (β1→4) linkage."
				width={500}
			/>
			<p className="mb-4">
				The stereochemistries affect the structure and properties of the
				polymers.
				For example, amylose, made of (α1→4) linkages like maltose,
				is forced to curve and makes helices.
			</p>
			<Image
				className="object-center mb-4"
				src="/resources/images/figures/BglB_pathway_fig3A.png"
				title="The three-dimensional structure of amylose."
				alt="Amylose has a curved chain and makes helices."
				width={250}
			/>
			<p className="mb-4">
				…But <b>cellulose</b>, made of (β1→4) linkages like cellobiose,
				forms straight, flat strands that together make sheets.
			</p>
			<Image
				className="object-center mb-4"
				src="/resources/images/figures/BglB_pathway_fig3B.png"
				title="The three-dimensional structure of cellulose."
				alt="Cellulose has straight, flat strands and makes sheets."
				width={300}
			/>
			<p className="mb-4">
				During metabolism, polysaccharides are chopped into smaller pieces,
				eventually becoming monosaccharides like glucose,
				which can be further metabolized for energy or used to build
				other saccharides.
				<b>Glycosidases</b>
				(<abbr>a.k.a.</abbr> <b><u>glycosid</u>e hydrol<u>ases</u></b>)
				are the enzymes that <b>hydrolyze</b> glycosidic bonds.
				(Hydrolysis is the <u>lysis</u> (cleavage) of a bond using <u>water</u>.)
				These “sugar scissors”, however, are very “picky”,
				acting only on particular linkage types and lengths of saccharides.
				Humans, for example, do not have the specific glycosidase cellulase
				available to cleave cellulose. Other creatures, like cows, do.
				(Technically, the symbiotic bacteria living in their stomachs do.)
				That is why we cannot digest grass.
			</p>
			<p className="mb-4">
				After cellulase cuts cellulose into smaller units, the enzyme
				BglB assists it in the process of metabolism by breaking down
				these smaller saccharide units and other (β1→4)-linked sugars.
				(Humans do not have BglB in our <em>stomachs</em>,
				but we <em>do</em> have it in other kinds of cells.)
			</p>
		</div>
	);
}