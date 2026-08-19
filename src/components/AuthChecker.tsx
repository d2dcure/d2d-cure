import React, { ReactNode, useState, useEffect } from "react"
import { LogInIcon, AlertCircleIcon, ClockIcon, ArrowLeftIcon } from 'lucide-react';
import { useUser } from "./UserProvider";
import { Button, Modal, ModalContent, ModalBody } from "@nextui-org/react";
import Link from "next/link";
import Spinner from "./Spinner";
import Footer from './Footer';

export const AuthChecker = (
    props: {
        minimumStatus: String
        children: ReactNode
    }
) => {
    const { user, loading } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [showLoading, setShowLoading] = useState(true);
    const [messageIndex, setMessageIndex] = useState(0);
    const [showSuccessNotif, setShowSuccessNotif] = useState(false);

    const loadingMessages = [
        { title: "Initializing Environment" },
        { title: "Loading Resources" },
        { title: "Verifying Credentials" },
        { title: "Finalizing Setup" }
    ];

    const messages = {
        login: {
            icon: <LogInIcon />,
            title: "Authentication Required",
            message: "Please sign in to access the research lab",
            primaryButton: { text: "Sign In", href: "/login" },
            secondaryButton: { text: "Learn More", href: "/" },
            footerLinks: [
                { text: "Documentation", href: "/docs" },
                { text: "Support", href: "/contact" },
                { text: "Contact", href: "/contact" }
            ]
        },
        accessDenied: {
            icon: <AlertCircleIcon />,
            title: "Access Restricted",
            message: "You need additional permissions to access this area",
            primaryButton: { text: "Go to Dashboard", href: "/dashboard" },
            secondaryButton: { text: "Go Back", href: "#", onClick: () => window.history.back() },
            footerLinks: [
                { text: "Documentation", href: "/docs" },
                { text: "Support", href: "/contact" },
                { text: "Contact", href: "/contact" }
            ]
        },
        pending: {
            icon: <ClockIcon />,
            title: "Approval Pending",
            message: "Your account is currently under review",
            primaryButton: { text: "View Status", href: "/contact" },
            secondaryButton: { text: "Contact Support", href: "/contact" },
            footerLinks: [
                { text: "Documentation", href: "/docs" },
                { text: "Support", href: "/support" },
                { text: "Contact", href: "/contact" }
            ]
        }
    };

    function validStatus() {
        if (!user) {
            return false;
        }

        if (user.status === "ADMIN" ||
            props.minimumStatus === "professor" && user.status === "professor" ||
            props.minimumStatus === "student" && user) {
            return true;
        } else {
            return false;
        }
    }

    useEffect(() => {
        if (loading || showLoading) {
            let messageChangeInterval = 500;
            const totalLoadingTime = loading ? 2000 : 500; // Shorter time if not actually loading
            
            // For quick loads, just show "Almost Ready"
            if (totalLoadingTime <= 500) {
                setMessageIndex(loadingMessages.length - 1);
                const loadingTimer = setTimeout(() => {
                    setShowLoading(false);
                }, totalLoadingTime);
                
                return () => clearTimeout(loadingTimer);
            }

            const messageInterval = setInterval(() => {
                setMessageIndex((prev) => 
                    prev < loadingMessages.length - 1 ? prev + 1 : prev
                );
            }, messageChangeInterval);

            const loadingTimer = setTimeout(() => {
                setShowLoading(false);
            }, totalLoadingTime);

            return () => {
                clearInterval(messageInterval);
                clearTimeout(loadingTimer);
            };
        }
    }, [loading, showLoading, loadingMessages.length]);

    useEffect(() => {
        if (user && !loading && !showLoading) {
            setShowSuccessNotif(true);
            const timer = setTimeout(() => {
                setShowSuccessNotif(false);
            }, 5000); // Hide after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [user, loading, showLoading]);

    const MessageDisplay = ({ message, isOpen, allowClose = false }: { 
        message: typeof messages.login, 
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
                            {React.cloneElement(message.icon as any, { className: 'w-6 h-6' })}
                        </p>
                        <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">{message.title}</h1>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">{message.message}</p>

                        <div className="flex items-center w-full mt-6 gap-x-3 justify-center">
                            <Link href={message.secondaryButton.href} className="flex items-center justify-center px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                                <ArrowLeftIcon className="w-5 h-5 rtl:rotate-180" />
                                <span>{message.secondaryButton.text}</span>
                            </Link>

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


    if (loading || showLoading) {
        const message = loadingMessages[messageIndex];
        return (
            <>
                {props.children}
                <Modal backdrop="blur" isOpen={isModalOpen} hideCloseButton>
                    <ModalContent>
                        <ModalBody className="py-12 text-center">
                            <div className="flex flex-col items-center space-y-6">
                                <Spinner 
                                    size="lg" 
                                    classNames={{
                                        circle1: "border-b-[#06B7DB]",
                                        circle2: "border-b-[#06B7DB]"
                                    }}
                                />
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                        {message.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Please wait while we set up your workspace
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    if (!user) {
        return (
            <>
                {props.children}
                <MessageDisplay 
                    message={messages.login} 
                    isOpen={isModalOpen}
                    // No closing allowed - must login
                />
            </>
        );
    } else if (!validStatus()) {
        return (
            <>
                {props.children}
                <MessageDisplay 
                    message={messages.accessDenied} 
                    isOpen={isModalOpen}
                    // No closing allowed - must have proper permissions
                />
            </>
        );
    } else if (!user.approved) {
        return (
            <>
                {props.children}
                <MessageDisplay 
                    message={messages.pending} 
                    isOpen={isModalOpen}
                    // No closing allowed - must be approved
                />
            </>
        );
    }

    return props.children;
}