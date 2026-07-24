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
				First, a nucleophile, (FooXXX in BglB,)
				attacks carbon 1 in an{' '}
				<abbr title="Substitution Nucleophilic Bimolecular">
					S<sub>N</sub>2
				</abbr>
				{' '}step. This cleaves off the byproduct saccharide and
				leaves the glucose residue covalently attached to the enzyme.
				S<sub>N</sub>2 steps always invert the stereochemistry of
				the atom where a bond forms and a bond breaks,
				so β changes to α
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
				src="/resources/images/figures/BglB_pathway_fig1.png"
				title="Two monosaccharides connected by a glycosidic bond, indicated by the blue oval."
				alt="A disaccharide is two monosaccharides connected by a glycosidic bond."
				width={250}
			/>
		</div>
	);
}