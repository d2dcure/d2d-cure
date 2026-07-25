// assays.tsx
// Author: Jason W. Labonte
// This file provides information for the assay chemistry of enzymes in
// the D2D Network.
// They are to be imported as components on other pages.

// Imports
import { Image } from "@nextui-org/react";

export function DefaultAssay() {
	return (
		<div>
			<p className="text-gray-600 text-justify">
				Details coming soon…
			</p>
		</div>
	);
}

export function BglBAssay() {
	return (
		<div className="text-gray-600 text-justify">
			<p className="mb-4">
				The kinetic and thermodynamic assays use a <b>substrate analog</b>{' '}
				that looks like cellobiose on one side and has a highly reactive
				leaving group on the other. This analog is called
				𝘱𝘢𝘳𝘢-nitrophenyl-β-ᴅ-glucopyranose, or 𝘱NPG.
				When BlgB performs the reaction and cleaves off glucose,
				the byproduct produced is the anion 𝘱𝘢𝘳𝘢-nitrophenolate,
				which is a yellow-colored compound because of the conjugation
				of its many p orbitals.
			</p>
			<Image
				className="object-center mb-4"
				src="/resources/images/figures/BglB_assay_fig.png"
				title="The assay reaction catalyzed by BglB."
				alt="𝘱NPG is hydrolyzed by BglB to produce 𝘱𝘢𝘳𝘢-nitrophenolate, a yellow-colored ion."
				width={750}
			/>
		</div>
	);
}