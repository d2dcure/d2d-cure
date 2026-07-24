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
				Foo
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