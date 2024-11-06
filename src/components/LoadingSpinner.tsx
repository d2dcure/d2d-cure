import React from 'react';
import { Modal, ModalContent, ModalBody, Spinner } from "@nextui-org/react";

interface LoadingSpinnerProps {
  isOpen: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isOpen }) => {
  return (
    <Modal backdrop="blur" isOpen={isOpen} hideCloseButton>
      <ModalContent>
        <ModalBody className="py-10 text-center">
          <Spinner 
            size="lg" 
            classNames={{
              circle1: "border-b-[#06B7DB]",
              circle2: "border-b-[#06B7DB]"
            }}
          />
          <p className="mt-4 text-lg text-gray-600">Hold tight, we&apos;re synthesizing the data. Enzyme magic takes time! 🧬✨</p>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default LoadingSpinner;
