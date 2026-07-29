import { Button, Card, CardBody, } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar'; // Assuming NavBar component is available
import Footer from '@/components/Footer'; // Assuming Footer component is available
import { AlertTriangleIcon } from 'lucide-react';

const Custom404 = () => {
  return (
    <>
      <NavBar />
      <section className="bg-white dark:bg-gray-900">
        <div className="container flex items-center justify-center min-h-screen px-6 py-12 mx-auto">
          <div className="w-full">
            <div className="flex flex-col items-center max-w-lg mx-auto text-center">
              <div className="px-4 py-1 rounded-full bg-[#06B7DB]/10 dark:bg-[#06B7DB]/20">
                <p className="text-sm font-medium text-[#06B7DB]">404 error</p>
              </div>
              
              <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">Oops! We lost this page</h1>
              <p className="mt-4 text-gray-500 dark:text-gray-400">We searched high and low, but couldn&apos;t find what you&apos;re looking for. Let&apos;s find a better place for you to go.</p>

              <div className="flex items-center w-full mt-6 gap-x-3 shrink-0 sm:w-auto">
                <Link href="javascript:history.back()" className="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg dark:text-gray-200 gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:border-gray-700">
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180" />
                  <span>Go back</span>
                </Link>

                <Link href="/" className="w-1/2 px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-[#06B7DB] rounded-lg shrink-0 sm:w-auto hover:bg-[#06B7DB]/90">
                  Take me home
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-6xl grid-cols-1 gap-8 mx-auto mt-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-lg bg-[#06B7DB]/5 dark:bg-gray-800">
                <span className="text-[#06B7DB] dark:text-gray-400">
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" />
                </span>
                <h3 className="mt-6 font-medium text-gray-700 dark:text-gray-200">Documentation</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Dive in to learn all about our product.</p>
                <Link href="/docs" className="inline-flex items-center mt-4 text-sm text-[#06B7DB] gap-x-2 hover:underline">
                  <span>Start learning</span>
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180" />
                </Link>
              </div>

              <div className="p-6 rounded-lg bg-[#06B7DB]/5 dark:bg-gray-800">
                <span className="text-[#06B7DB] dark:text-gray-400">
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" />
                </span>
                <h3 className="mt-6 font-medium text-gray-700 dark:text-gray-200">Our Journey</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Read about how we built this website.</p>
                <Link href="https://codelabdavis.medium.com/d2dcure-2276a41bfaf9" className="inline-flex items-center mt-4 text-sm text-[#06B7DB] gap-x-2 hover:underline">
                  <span>Read our story</span>
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180" />
                </Link>
              </div>

              <div className="p-6 rounded-lg bg-[#06B7DB]/5 dark:bg-gray-800">
                <span className="text-[#06B7DB] dark:text-gray-400">
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" />
                </span>
                <h3 className="mt-6 font-medium text-gray-700 dark:text-gray-200">Report an Issue</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Found a bug or need to contact us?</p>
                <Link href="/contact" className="inline-flex items-center mt-4 text-sm text-[#06B7DB] gap-x-2 hover:underline">
                  <span>Get in touch</span>
                  <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Custom404;