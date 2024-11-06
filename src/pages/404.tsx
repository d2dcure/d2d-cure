import { Button, Card, CardBody, } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar'; // Assuming NavBar component is available
import Footer from '@/components/Footer'; // Assuming Footer component is available

const Custom404 = () => {
  return (
    <>
    
      <NavBar />
      <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-white text-center">
        <div className="w-full max-w-lg">
            <h1 className="text-6xl font-bold text-[#06B7DB]">404</h1>
            <p className="text-2xl text-gray-600 mb-8">Oops! The page you are looking for doesn&apos;t exist.</p>
            <Link href="/">
              <Button  size="lg" className="bg-[#06B7DB] text-white">Go Back to Home</Button>
            </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Custom404;
