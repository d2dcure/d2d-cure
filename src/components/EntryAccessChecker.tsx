import { ReactNode, useEffect, useState } from "react";
import { useUser } from "./UserProvider";
import { AuthChecker } from "./AuthChecker";
import { Modal, ModalContent, ModalBody } from "@nextui-org/react";
import Link from "next/link";

interface EntryAccessCheckerProps {
  children: ReactNode;
  entryData: any;
  loading?: boolean;
}

export const EntryAccessChecker = ({ children, entryData, loading = false }: EntryAccessCheckerProps) => {
  const { user } = useUser();
  const [hasAccess, setHasAccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Reuse the same message structure from AuthChecker
  const accessDeniedMessage = {
    icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
    title: "Access Restricted",
    message: "You do not have permission to view this entry",
    primaryButton: { text: "Go to Dashboard", href: "/dashboard" },
    secondaryButton: { text: "Go Back", href: "#", onClick: () => window.history.back() },
    footerLinks: [
      { text: "Documentation", href: "/docs" },
      { text: "Support", href: "/contact" },
      { text: "Contact", href: "/contact" }
    ]
  };

  useEffect(() => {
    if (!loading && entryData && user) {
      const isCreator = user.user_name === entryData.creator;
      const isTeammate = [
        entryData.teammate,
        entryData.teammate2,
        entryData.teammate3
      ].includes(user.user_name);
      const isAdminOrProfessor = user.status === "ADMIN" || user.status === "professor";

      const userHasAccess = isCreator || isTeammate || isAdminOrProfessor;
      setHasAccess(userHasAccess);

      if (!userHasAccess) {
        setShowModal(true);
      }
    }
  }, [user, entryData, loading]);

  const MessageDisplay = ({ message, isOpen }: { 
    message: typeof accessDeniedMessage, 
    isOpen: boolean,
  }) => (
    <Modal 
      backdrop="blur" 
      isOpen={isOpen} 
      hideCloseButton
      size="2xl"
      className="dark:bg-gray-900"
      isDismissable={false}
    >
      <ModalContent>
        <ModalBody className="py-8">
          <div className="flex flex-col items-center text-center">
            <p className="p-3 text-sm font-medium text-[#06B7DB] rounded-full bg-blue-50 dark:bg-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d={message.icon} />
              </svg>
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">{message.title}</h1>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{message.message}</p>

            <div className="flex items-center w-full mt-6 gap-x-3 justify-center">
              <button
                onClick={message.secondaryButton.onClick}
                className="flex items-center justify-center px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                </svg>
                <span>{message.secondaryButton.text}</span>
              </button>

              <Link href={message.primaryButton.href} className="px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-[#06B7DB] rounded-lg hover:bg-[#05a6c7] dark:hover:bg-[#05a6c7] dark:bg-[#06B7DB]">
                {message.primaryButton.text}
              </Link>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 w-full">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {message.footerLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors duration-300 hover:text-[#06B7DB] dark:text-gray-300 dark:hover:text-[#06B7DB]"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  return (
    <AuthChecker minimumStatus="student">
      {loading ? (
        <div>Loading...</div>
      ) : hasAccess ? (
        children
      ) : (
        <MessageDisplay 
          message={accessDeniedMessage} 
          isOpen={showModal}
        />
      )}
    </AuthChecker>
  );
}; 