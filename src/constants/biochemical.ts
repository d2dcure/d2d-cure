// biochemical.ts
// Author: Jason W. Labonte
// This file contains biochemical constants and data that can be imported for
// use in the D2D database website.


export const canonicalAAs = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L',
		'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y']


export const negativeAAs = ['D', 'E']

export const positiveAAs = ['H', 'K', 'R']


export const polarChargedAAs = negativeAAs.concat(positiveAAs)

export const polarUnchargedAAs = ['C', 'N', 'Q', 'S', 'T', 'Y']


export const hydrophilicAAs = polarChargedAAs.concat(polarUnchargedAAs)

export const hydrophobicAAs =
		canonicalAAs.filter((aa) => !hydrophilicAAs.includes(aa))


export const aromaticAAs = ['H', 'F', 'Y', 'W']

export const aliphaticAAs =
		canonicalAAs.filter((aa) => !aromaticAAs.includes(aa))


export const helixBreakingAAs = ['G', 'P']


export const smallAAs = ['A', 'G']

export const bulkyAAs = ['E', 'F', 'H', 'I', 'K', 'L', 'M', 'Q', 'R', 'Y', 'W']