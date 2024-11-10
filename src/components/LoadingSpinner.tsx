// import React from 'react';
// import { Modal, ModalContent, ModalBody, Spinner } from "@nextui-org/react";

// interface LoadingSpinnerProps {
//   isOpen: boolean;
// }

// const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isOpen }) => {
//   const loadingMessages = [
//     {
//       title: "🧪 Processing...",
//       message: "Our lab equipment is warming up! Just a moment while we prepare your workspace..."
//     },
//     {
//       title: "🔬 Initializing...",
//       message: "Calibrating our scientific instruments. Stand by for breakthrough discoveries..."
//     },
//     {
//       title: "⚗️ Almost Ready...",
//       message: "Running final safety checks on our laboratory systems. Safety first!"
//     },
//     {
//       title: "🧬 Synthesizing...",
//       message: "Hold tight, we're synthesizing the data. Enzyme magic takes time! ✨"
//     }
//   ];

//   // Get a random message from the array
//   const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

//   return (
//     <Modal backdrop="blur" isOpen={isOpen} hideCloseButton>
//       <ModalContent>
//         <ModalBody className="py-10 text-center">
//           <Spinner 
//             size="lg" 
//             classNames={{
//               circle1: "border-b-[#06B7DB]",
//               circle2: "border-b-[#06B7DB]"
//             }}
//           />
//           <h3 className="mt-4 text-xl font-semibold">{randomMessage.title}</h3>
//           <p className="mt-2 text-lg text-gray-600">{randomMessage.message}</p>
//         </ModalBody>
//       </ModalContent>
//     </Modal>
//   );
// };

// export default LoadingSpinner;
