import { ReactNode, useState, useEffect } from "react"
import { useUser } from "./UserProvider";
import { Button, Modal, ModalContent, ModalBody } from "@nextui-org/react";
import Link from "next/link";
import Spinner from "./Spinner";

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

    const loadingMessages = [
        { title: "🧪 Preparing Lab..." },
        { title: "🔬 Loading Data..." },
        { title: "⚗️ Running Checks..." },
        { title: "🧬 Almost Ready..." }
    ];

    const loginMessages = [
        {
            title: "Welcome, Future Scientist! 🧬",
            message: "Please log in to access the research lab."
        },
        {
            title: "Lab Access Required 🔬",
            message: "Don't forget your virtual lab coat - please sign in."
        },
        {
            title: "Ready to Experiment? 🧪",
            message: "Just a quick authentication first."
        }
    ];

    const approvalMessages = [
        {
            title: "⏳ Approval Pending",
            message: "Our research team is reviewing your application."
        },
        {
            title: "🔬 Under Review",
            message: "Good things come to those who wait (in the lab)."
        },
        {
            title: "⚗️ Processing...",
            message: "Running final checks on your lab access."
        }
    ];

    const accessDeniedMessages = [
        {
            title: "🚫 Access Denied",
            message: "Looks like you need a higher clearance level for this lab."
        },
        {
            title: "🔒 Restricted Area",
            message: "This experiment requires additional credentials."
        },
        {
            title: "⚠️ Hold Up!",
            message: "You'll need special access for this research area."
        }
    ];

    const getRandomMessage = (messages: any[]) => {
        return messages[Math.floor(Math.random() * messages.length)];
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
    }, [loading, showLoading]);

    if (loading || showLoading) {
        const message = loadingMessages[messageIndex];
        return (
            <>
                {props.children}
                <Modal backdrop="blur" isOpen={isModalOpen} hideCloseButton>
                    <ModalContent>
                        <ModalBody className="py-6 text-center">
                            <Spinner 
                                size="lg" 
                                classNames={{
                                    circle1: "border-b-[#06B7DB]",
                                    circle2: "border-b-[#06B7DB]"
                                }}
                            />
                            <h3 className="mt-4 text-xl font-semibold">{message.title}</h3>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    if (!user) {
        const message = getRandomMessage(loginMessages);
        return (
            <>
                {props.children}
                <Modal backdrop="blur" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <ModalContent>
                        <ModalBody className="py-8 text-center">
                            <h1 className="text-2xl font-bold mb-4">{message.title}</h1>
                            <p className="mb-6">{message.message}</p>
                            <Link href="/login" passHref>
                                <Button color="primary" className="bg-[#06B7DB]">
                                    Enter the Lab 🧪
                                </Button>
                            </Link>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </>
        );
    } else if (!validStatus()) {
        const message = getRandomMessage(accessDeniedMessages);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
                <h1 className="text-6xl font-bold text-[#06B7DB]">{message.title}</h1>
                <p className="mt-4 mb-8 text-xl">{message.message}</p>
                <Link href="/dashboard" passHref>
                    <Button color="primary" className="bg-[#06B7DB]">
                        Back to Your Lab 🔬
                    </Button>
                </Link>
            </div>
        );
    } else if (!user.approved) {
        const message = getRandomMessage(approvalMessages);
        return (
            <>
                {props.children}
                <Modal backdrop="blur" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <ModalContent>
                        <ModalBody className="py-8 text-center">
                            <h1 className="text-2xl font-bold mb-4">{message.title}</h1>
                            <p className="mb-6">{message.message}</p>
                            <Link href="/dashboard" passHref>
                                <Button color="primary" className="bg-[#06B7DB]">
                                    Return to Base 🧪
                                </Button>
                            </Link>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    return props.children;
}