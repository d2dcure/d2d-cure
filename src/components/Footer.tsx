import React from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, DropdownItem, DropdownTrigger, Dropdown, DropdownMenu } from "@nextui-org/react";

export default function App() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t-1" style={{ maxWidth: 'full' }}>
      <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <Image 
                src="/resources/images/D2D_Logo.svg" 
                alt="logo" 
                width={64}
                height={64}
                className="me-3 select-none" 
                draggable={false}
                priority
              />
            </Link>
            <div className="mt-4 text-gray-500 dark:text-gray-400 space-y-2">
              <p>451 Health Sciences Dr.,<br />Davis, CA 95616</p>
              <p>(530) 754-9654</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">Company</h2>
              <ul className="text-gray-500 dark:text-gray-400 font-medium">
                <li className="mb-2">
                  <Link href="/about" className="hover:underline font-light">About us</Link>
                </li>
                <li>
                  <Link href="/about#team" className="hover:underline font-light">Meet the team</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">Databases</h2>
              <ul className="text-gray-500 dark:text-gray-400 font-medium">
                <li className="mb-2">
                  <Link href="/submit" className="hover:underline font-light">Single Variant Submission</Link>
                </li>
                <li className="mb-2">
                  <Link href="/submit" className="hover:underline font-light">Wildtype Submission</Link>
                </li>
                <li className="mb-2">
                  <Link href="/submit/gel_image_upload" className="hover:underline font-light">Gel Image Upload</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">Resources</h2>
              <ul className="text-gray-500 dark:text-gray-400 font-medium">
                <li className="mb-2">
                  <Link href="/privacy-policy" className="hover:underline font-light">Privacy Policy</Link>
                </li>
                <li className="mb-2">
                  <Link href="/resources/StructuredFiles" className="hover:underline font-light">Structure and Sequence Files</Link>
                </li>
                <li className="mb-2">
                  <Link href="/resources/oligosearch" className="hover:underline font-light">Oligo Search</Link>
                </li>
                <li className="mb-2">
                  <Link href="/resources/bglb" className="hover:underline font-light">Complete BgLb Sequence</Link>
                </li>
                <li className="mb-2 font-light">
                  <Link href="/resources/data-calculation" className="hover:underline">How data is calculated</Link>
                </li>
                <li className="mb-2 font-light">
                  <Link href="/resources/data-interpretation" className="hover:underline">How to interpret data</Link>
                </li>
                <li className="mb-2 font-light">
                  <Link href="/resources/calculator" className="hover:underline">Enzyme Rate Calculator</Link>
                </li>
                <li className="mb-2 font-light">
                  <Link href="/resources/publications" className="hover:underline">Publications</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
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
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2023 <Link href="/" className="hover:underline">D2D CURE © 2018–2024 ~ The D2D CURE Program is supported by the National Science Foundation&apos;s Undergraduate Biology Education IUSE Program, award number 1827246. Website maintained by Jason William Labonte. </Link>. All Rights Reserved.
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0">
          </div>
        </div>
      </div>
    </footer>
  );
}