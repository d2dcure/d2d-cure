import { ReactNode, useState, useEffect } from "react";
import { Modal, ModalContent, ModalBody, ModalHeader, ModalFooter, Button } from "@nextui-org/react";
import Link from "next/link";

interface ErrorCheckerProps {
  children: ReactNode;
  isError: boolean;
  errorMessage: string | string[];
  errorType?: 'api' | 'validation' | 'general' | 'auth' | 'custom';
}

interface ButtonConfig {
  text: string;
  href: string;
  onClick?: () => void;
}

interface ErrorMessage {
  icon: string;
  title: string;
  message: string | string[];
  primaryButton: ButtonConfig;
  secondaryButton: ButtonConfig;
  footerLinks: { text: string; href: string; }[];
}

export const ErrorChecker: React.FC<ErrorCheckerProps> = ({ 
  isError, 
  errorMessage, 
  errorType = 'api',
  children 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [errorMessage]);

  if (isLoading) {
    return null;
  }

  const messages: Record<NonNullable<ErrorCheckerProps['errorType']>, ErrorMessage> = {
    api: {
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      title: "Service Temporarily Unavailable",
      message: Array.isArray(errorMessage) 
        ? errorMessage.join('\n') 
        : (errorMessage || "We're having trouble connecting to our services. Please try again later."),
      primaryButton: { text: "Retry", href: "#", onClick: () => window.location.reload() },
      secondaryButton: { text: "Report Issue", href: "/contact/report" },
      footerLinks: [
        { text: "Support", href: "/support" },
        { text: "Contact", href: "/contact" },
        { text: "Status", href: "/status" }
      ]
    },
    auth: {
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      title: "Authentication Error",
      message: errorMessage || "There was a problem with your authentication. Please try signing in again.",
      primaryButton: { text: "Sign In", href: "/login" },
      secondaryButton: { text: "Go Back", href: "#", onClick: () => window.history.back() },
      footerLinks: [
        { text: "Support", href: "/support" },
        { text: "Contact", href: "/contact" }
      ]
    },
    validation: {
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      title: "Validation Error",
      message: errorMessage || "Please check your input and try again.",
      primaryButton: { text: "Try Again", href: "#", onClick: () => window.location.reload() },
      secondaryButton: { text: "Get Help", href: "/support" },
      footerLinks: [
        { text: "Documentation", href: "/docs" },
        { text: "Contact", href: "/contact" }
      ]
    },
    general: {
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      title: "Error",
      message: errorMessage || "An unexpected error occurred.",
      primaryButton: { text: "Retry", href: "#", onClick: () => window.location.reload() },
      secondaryButton: { text: "Go Back", href: "#", onClick: () => window.history.back() },
      footerLinks: [
        { text: "Support", href: "/support" },
        { text: "Contact", href: "/contact" }
      ]
    },
    custom: {
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      title: "Error",
      message: errorMessage || "An unexpected error occurred.",
      primaryButton: { text: "Retry", href: "#", onClick: () => window.location.reload() },
      secondaryButton: { text: "Go Back", href: "#", onClick: () => window.history.back() },
      footerLinks: [
        { text: "Support", href: "/support" },
        { text: "Contact", href: "/contact" }
      ]
    }
  };

  const MessageDisplay = ({ message, isOpen, allowClose = true }: { 
    message: typeof messages.api,
    isOpen: boolean,
    allowClose?: boolean 
  }) => (
    <Modal 
      backdrop="blur" 
      isOpen={isOpen} 
      onClose={allowClose ? () => setIsModalOpen(false) : undefined}
      hideCloseButton={!allowClose}
      size="2xl"
      className="dark:bg-gray-900"
      isDismissable={allowClose}
    >
      <ModalContent>
        <ModalBody className="py-8">
          <div className="flex flex-col items-center text-center">
            <p className="p-3 text-sm font-medium text-[#06B7DB] rounded-full bg-blue-50 dark:bg-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d={message.icon} />
              </svg>
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
              {message.title}
            </h1>
            <p className="mt-4 text-gray-500 dark:text-gray-400 whitespace-pre-line">
              {message.message}
            </p>

            <div className="flex items-center w-full mt-6 gap-x-3 justify-center">
              {message.secondaryButton.onClick ? (
                <button 
                  onClick={message.secondaryButton.onClick}
                  className="flex items-center justify-center px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                  </svg>
                  <span>{message.secondaryButton.text}</span>
                </button>
              ) : (
                <Link 
                  href={message.secondaryButton.href} 
                  className="flex items-center justify-center px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                  </svg>
                  <span>{message.secondaryButton.text}</span>
                </Link>
              )}

              {message.primaryButton.onClick ? (
                <button
                  onClick={message.primaryButton.onClick}
                  className="px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-[#06B7DB] rounded-lg hover:bg-[#05a6c7] dark:hover:bg-[#05a6c7] dark:bg-[#06B7DB]"
                >
                  {message.primaryButton.text}
                </button>
              ) : (
                <Link 
                  href={message.primaryButton.href}
                  className="px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-[#06B7DB] rounded-lg hover:bg-[#05a6c7] dark:hover:bg-[#05a6c7] dark:bg-[#06B7DB]"
                >
                  {message.primaryButton.text}
                </Link>
              )}
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

  if (isError) {
    return (
      <>
        {children}
        <MessageDisplay 
          message={messages[errorType]} 
          isOpen={isModalOpen}
          allowClose={true}
        />
      </>
    );
  }

  return children;
}; 