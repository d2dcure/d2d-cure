import React from "react";
import Link from 'next/link';
import Image from 'next/image';

export default function App() {
	return (
		<footer className="bg-white dark:bg-gray-900 border-t-1" style={{ maxWidth: 'full' }}>
			<div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
				<div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 px-2 sm:px-4">
					<Image 
						src="/resources/images/CUREnet_logo.png" 
						alt="CUREnet Logo" 
						width={120}
						height={40}
						style={{ objectFit: 'contain', width: 'auto', height: '40px' }}
						className="h-6 sm:h-8 md:h-10 w-auto select-none" 
						draggable={false}
						quality={100}
					/>
					<Image 
						src="/resources/images/Rosetta_logo.png" 
						alt="Rosetta Logo" 
						width={120}
						height={40}
						style={{ objectFit: 'contain', width: 'auto', height: '40px' }}
						className="h-6 sm:h-8 md:h-10 w-auto select-none" 
						draggable={false}
						quality={100}
					/>
					<Image 
						src="/resources/images/NSF_logo.png" 
						alt="NSF Logo" 
						width={120}
						height={40}
						style={{ objectFit: 'contain', width: 'auto', height: '40px' }}
						className="h-6 sm:h-8 md:h-10 w-auto select-none" 
						draggable={false}
						quality={100}
					/>
					<Image 
						src="/resources/images/UC Davis_logo.png" 
						alt="UC Davis Logo" 
						width={120}
						height={40}
						style={{ objectFit: 'contain', width: 'auto', height: '40px' }}
						className="h-6 sm:h-8 md:h-10 w-auto select-none" 
						draggable={false}
						quality={100}
					/>
					<Image 
						src="/resources/images/codelablogo.png" 
						alt="CodeLab Logo" 
						width={100}
						height={32}
						style={{ objectFit: 'contain', width: 'auto', height: '32px' }}
						className="h-4 sm:h-6 md:h-8 w-auto select-none" 
						draggable={false}
						quality={100}
					/>
				</div>
				<div className="sm:flex sm:items-center sm:justify-between">
					<span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
						<Link href="/" className="hover:underline">D2D CURE © 2018–{new Date().getFullYear()} </Link> ~ The D2D CURE Program is supported by <Link href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=1827246" target="_blank" className="hover:underline text-[#06B7DB]" rel="noopener noreferrer">the National Science Foundation&apos;s Undergraduate Biology Education IUSE Program, award number 1827246</Link>.<br />
						Website maintained by <a href="mailto:webmaster@d2dcure.com?subject=D2D%20Cure%20Website%20Issues" className="hover:underline text-[#06B7DB]">Jason William Labonte</a>. All Rights Reserved.
					</span>
					<div className="flex mt-4 sm:justify-center sm:mt-0">
					</div>
				</div>
			</div>
		</footer>
	);
}