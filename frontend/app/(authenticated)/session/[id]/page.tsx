"use client"

import React, { Suspense, useEffect, useState } from 'react';
import { Clock3, Flag, MessageSquareText, MicIcon, MicOffIcon, OctagonXIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import SessionLoading from '../loading';

const DynamicCodeEditor = dynamic(() => import('../code-editor/code-editor'), { ssr: false });
const DynamicTextEditor = dynamic(() => import('../text-editor'), { ssr: false });

export default function Session({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isMicEnabled, setIsMicEnabled] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return SessionLoading();
    }

    const handleMicToggle = () => {
        setIsMicEnabled(!isMicEnabled);
        if (!isMicEnabled) {
            toast('Your mic is now unmuted', {
                className: "justify-center font-sans text-sm",
                duration: 1500,
                icon: <MicIcon className="h-4 w-4 mr-2 text-green-500" />,
            });
        } else {
            toast('Your mic is now muted', {
                className: "justify-center font-sans text-sm",
                duration: 1500,
                icon: <MicOffIcon className="h-4 w-4 mr-2 text-red-500" />,
            });
        }
    };

    async function endSession() {
        router.push('/questions');
    }

    return (
        <Suspense fallback={SessionLoading()}>
            <div className="flex flex-col gap-8 min-h-screen">
                <div className="flex justify-between text-black bg-white drop-shadow mt-20 mx-8 p-4 rounded-xl relative">
                    <div className="flex items-center gap-2 text-sm">
                        <span>Session {params.id}</span>
                        <div className="flex items-center bg-brand-200 text-brand-800 py-2 px-3 font-semibold rounded-lg"><Clock3 className="h-4 w-4 mr-2" />3:35</div>
                        <span>with</span>
                        <span className="font-semibold">username</span>
                    </div>
                    <div className="mr-[52px]">
                        <Toggle 
                            onPressedChange={handleMicToggle}
                            >
                            {isMicEnabled ? (
                                <MicIcon className="size-5 text-green-500" />
                            ) : (
                                <MicOffIcon className="size-5 text-red-500" />
                            )}
                        </Toggle>
                    </div>
                    <div className="">
                        <Dialog>
                            <DialogTrigger><Button><OctagonXIcon className="size-4 mr-2" />End Session</Button></DialogTrigger>
                            <DialogContent
                                className="laptop:max-w-[40vw] bg-white text-black font-sans rounded-2xl"
                            >
                                <DialogHeader className="items-start">
                                <DialogTitle className="font-serif font-normal tracking-tight text-3xl">
                                    End your session?
                                </DialogTitle>
                                <DialogDescription className="hidden"></DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col w-full gap-1 py-4 justify-start">
                                    <p>Are you sure you want to end your session?</p>
                                </div>
                                <DialogFooter className="flex items-end">
                                    <DialogClose asChild>
                                        <Button
                                            variant="ghost"
                                            className="rounded-lg"
                                            onClick={endSession}
                                        >
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        className="rounded-lg bg-brand-700 hover:bg-brand-600"
                                        onClick={endSession}
                                    >
                                        End session
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                                <div className="h-[calc(100%-2rem)] overflow-auto text-black bg-white drop-shadow-question-details p-6 mx-8 rounded-xl">
                                    <h3 className="text-2xl font-serif font-medium tracking-tight">
                                        {/* {selectedViewQuestion.title} */}
                                        Question title
                                    </h3>
                                    <div className="flex items-center gap-10 mt-3">
                                        <div className="flex items-center gap-2">
                                            <Flag className="h-4 w-4 text-icon" />
                                            <Badge
                                                variant={
                                                    // selectedViewQuestion.complexity as BadgeProps["variant"]
                                                    'easy'
                                                }
                                            >
                                                {/* {selectedViewQuestion.complexity} */}
                                                Easy
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MessageSquareText className="h-4 w-4 text-icon" />
                                            {/* {selectedViewQuestion.categories.map((category) => ( */}
                                            <Badge
                                                // key={category}
                                                variant="category"
                                                className="uppercase text-category-text bg-category-bg"
                                            >
                                                {/* {category} */}
                                                Algorithms
                                            </Badge>
                                            {/* ))} */}
                                        </div>
                                    </div>
                                    <p className="mt-8 text-sm text-foreground">
                                        {/* {selectedViewQuestion.description} */}
                                        Question description
                                    </p>
                                </div>
                            </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                            <div className="h-[calc(100%-4rem)] bg-white drop-shadow-question-details rounded-xl m-8">
                                <DynamicTextEditor />
                            </div>
                        </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                        <DynamicCodeEditor />
                    </ResizablePanel>
                    <Toaster position="top-center" closeButton offset={"16px"} visibleToasts={2} gap={8} />
                </ResizablePanelGroup>
            </div>
        </Suspense>
    );
}