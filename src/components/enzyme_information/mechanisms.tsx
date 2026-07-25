// mechanisms.tsx
// Author: Jason W. Labonte
// This file provides information for the chemical mechanisms of enzymes in
// the D2D Network.
// They are to be imported as components on other pages.

// Imports
import { Image } from "@nextui-org/react";

export function DefaultMechanism() {
	return (
		<div>
			<p className="text-gray-600 text-justify">
				Details coming soon…
			</p>
		</div>
	);
}

export function BglBMechanism() {
	return (
		<div className="text-gray-600 text-justify">
			<p className="mb-4">
				BglB is considered an <b>exoglycosidase</b>{' '}
				because it cleaves at the end (<u>outside</u>),
				which is also called the <b>non-reducing end</b>{' '}
				of the sugar. It is considered a <b>retaining</b> glycosidase,
				because the product has the same stereochemistry at carbon 1
				as it did in the substrate.
			</p>
			<p className="mb-4">
				To maintain the stereochemistry at carbon 1,
				the eznyme uses what is called an <b>inverting mechansism</b>.
				First, a nucleophile, the carboxylate side chain of{' '}
				<abbr title="Glutamate">Glu</abbr>356
				(Glu353 in our Foldit model) in BglB,
				attacks carbon 1 in an{' '}
				<abbr title="Substitution Nucleophilic Bimolecular">
					S<sub>N</sub>2
				</abbr>
				{' '}step. This cleaves off the byproduct saccharide and
				leaves the glucose residue covalently attached to the enzyme.
				S<sub>N</sub>2 steps always invert the stereochemistry of
				the atom where a bond forms and a bond breaks,
				so β changes to α.
			</p>
			<p className="mb-4">
				Then, water attacks carbon 1 in a second S<sub>N</sub>2,
				which cleaves the glucose from the enzyme.
				This is a second inversion of stereochemisty—hence,
				“<em>double</em> inversion”—giving β-glucose as the second
				product with its stereochemistry “retained”.
			</p>
			<Image
				className="object-center mb-4"
				src="/resources/images/figures/BglB_mechanism_fig.png"
				title="A mechanistic scheme of the BglB reaction."
				alt="In the first step, Glu356 attacks C1. The leaving saccharide is protonated by Glu167. In the second step, Glu167 deprotonates water, which attacks C1."
				width={1000}
			/>
			<p className="mb-4">
				For BglB, two other active-site residues are also very important.{' '}
				<abbr title="Tyrosine">Tyr</abbr>298 (Tyr295 in our Foldit model)
				helps hold Glu356 in place and/or acts as a base to deprotonate
				the caboxylic-acid side chain, making Glu356 into a stronger nucleophile.
				(Tyr298 is not shown in the mechanistic scheme above.)
				Glu167 (Glu164 in our Foldit model) first protonates the saccharide{' '}
				<b>leaving group</b>.
				Then, it acts as a base to make the water a better nucleophile.
				
			</p>
		</div>
	);
}