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
				Lorem ipsum dolor sit amet, consectetur adipiscing elit,
				sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
				Ut enim ad minim veniam,
				quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			</p>
		</div>
	);
}

export function BglBPathway() {
	return (
		<div>
			<p className="text-gray-600 text-justify">
				Polysaccharides, like starch and glycogen,...
			</p>
			<Image 
				src=""
				title="BglB Biochemical Pathway"
				alt="Disaccharide to monosaccharide"
			/>
		</div>
	);
}