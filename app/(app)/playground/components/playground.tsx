'use client'
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast";

import { MaxLengthSelector } from "./maxlength-selector"
import { ModelSelector } from "./model-selector"
import { PresetActions } from "./preset-actions"
import { PresetSave } from "./preset-save"
import { PresetSelector } from "./preset-selector"
import { TemperatureSelector } from "./temperature-selector"
import { TopPSelector } from "./top-p-selector"
import { models, types } from "../data/models"
import { usePlayground } from "@/components/providers/PlaygroundProvider"
import RichEditor from "@/components/playground/components/RichEditor"
import { useEffect, useState } from "react"
import axios from "axios"
import { CardsChat } from "./chat"
import { useContact } from "@/components/providers/ContactProvider"
import { ContactSelector } from "./contact-selector"
import { Switch } from "@/components/ui/switch"


export default function PlaygroundPage() {
    const [isLoading, setLoading] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [isTask, setIsTask] = useState(false);
    const { presets, selectedContact, messages, setMessages, userMessage, setUserMessage, selectedPreset, setSelectedPreset, preset, setPreset } = usePlayground();
    const { user, system } = useContact();


    // const handleAddMessage = async (message: any) => {

    //   if(selectedPreset){
    //     await axios.post(`/api/conversations`, message);
    //   }
    // }

    const getConversations = async () => {
        try {
            setLoading(true)
            // setMessages([]);

            // .finally(() => setLoading(false));

            const response = await fetch(`/api/conversations?contact=${selectedContact ? selectedContact.phone : user.phone}${system?.phone ? `&system=${system.phone}` : ''}${selectedPreset?.value ? `&preset=${selectedPreset?.value}` : ''}`); // Update the endpoint URL if necessary
            console.log('response CONVO', response)

            if (!response.ok) {
                throw new Error("Failed to fetch conversations");
            }

            const data = await response.json();
            console.log('RESP CONVO', data)
            if (data && Array.isArray(data)) {
                setMessages(data); // Assuming `data.data` contains the conversations array
            }

        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false)
        }
    };


    const handleMessageSubmit = async () => {
        try {
            setLoading(true)
            let newMessages = messages;

            newMessages.push({
                role: 'user',
                content: userMessage
            })


            setUserMessage('')

            // let apiUrl = selectedPreset ? `/api/presets/chat/${selectedPreset._id}` : '/api/presets/chat'
            let apiUrl = '/api/presets/chat'

            if (isTask) {


                apiUrl = '/api/tasks'


                await axios.post(apiUrl, {
                    status: 'Todo',
                    priority: 'High',
                    category: 'Api',
                    title: 'Chat AI',
                    taskObject: JSON.stringify({
                        url: `http://127.0.0.1:3000/api/presets/chat`,
                        method: 'post',
                        dataObject: {
                            modelName: preset?.modelName ?? preset?.aiModel,
                            sender: selectedContact?.phone ? selectedContact?.phone : user.phone,
                            system: system.phone,
                            message: userMessage,
                            /* instruction */
                        }
                    })
                })

            } else {





                let resp = await axios.post(apiUrl, {
                    ...preset,
                    modelName: preset?.modelName ?? preset?.aiModel,
                    sender: selectedContact?.phone ? selectedContact?.phone : user.phone,
                    system: system.phone,
                    message: userMessage,
                    instruction
                });


                if (resp.data.done) {
                    newMessages.push({
                        role: 'assistant',
                        content: resp.data.message.content
                    })

                    // setMessages(newMessages)
                    getConversations()
                    /*        if(resp.data.preset){
                            setSelectedPreset(resp.data.preset)
                          }  */
                }

            }

            // router.refresh();
        } catch (err) {
            console.log("Failed to update the course", err);
            toast.error("Something went wrong!");
        } finally {
            setLoading(false)
        }
    };

    const handleMessageResubmit = async () => {
        try {
            setLoading(true)

            let apiUrl = '/api/presets/chat'
            let lastUserMessage = messages[messages.length - 2];
            let newMessages = messages.slice(0, -2);



            messages.pop();
            messages.pop();

            messages.push({
                role: 'user',
                content: lastUserMessage.content
            })




            setMessages(messages)


            let resp = await axios.post(apiUrl, {
                ...preset,
                modelName: preset?.modelName ?? preset?.aiModel,
                sender: selectedContact?.phone ? selectedContact?.phone : user.phone,
                system: system.phone,
                message: lastUserMessage.content,
                instruction
            });


            if (resp.data.done) {
                messages.push({
                    role: 'assistant',
                    content: resp.data.message.content
                })

                setMessages(messages)

                /*        if(resp.data.preset){
                        setSelectedPreset(resp.data.preset)
                      }  */
            }

            // toast.success("Course Updated");
            // router.refresh();
        } catch (err) {
            console.log("Failed to update the course", err);
            toast.error("Something went wrong!");
        } finally {
            setLoading(false)
        }
    };


    const handleSavePreset = async () => {
        try {
            if (selectedPreset && selectedPreset._id) {
                let resp = await axios.patch(`/api/presets/${selectedPreset._id}`, {
                    ...preset,
                    systemBehavior: preset.systemBehavior,
                    modelName: preset.modelName,
                    aiTemperature: preset.temperature,
                    aiTopP: preset.topP,
                    aiMaxLength: preset.maxTokens
                });
                if (resp.data) {
                    toast.success("Preset Updated");
                }

            } else {
                let resp = await axios.post(`/api/presets`, {
                    ...preset,
                    systemBehavior: preset.systemBehavior,
                    modelName: preset.modelName,
                    aiTemperature: preset.temperature,
                    aiTopP: preset.topP,
                    aiMaxLength: preset.maxTokens
                });
                if (resp.data) {
                    toast.success("Preset Created");
                }
            }



            // router.refresh();
        } catch (err) {
            console.log("Failed to update the course", err);
            toast.error("Something went wrong!");
        }
    };


    useEffect(() => {

        if (system) {
            getConversations();
        }

        if (system && (!selectedContact && !selectedPreset)) {
            setMessages([])
            getConversations()
        }


    }, [selectedContact, system])





    return (
        <div className="flex-1 space-y-4 p-8 pt-3">
            <div className="h-full flex-col md:flex">
                <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
                    <h2 className="text-lg font-semibold">Playground</h2>
                    <div className="ml-auto flex w-full space-x-2 sm:justify-end">
                        <ContactSelector />

                        <PresetSelector />
                        <PresetSave />
                        {/* <div className="hidden space-x-2 md:flex">
              <CodeViewer />
              <PresetShare />
            </div> */}
                        <PresetActions />
                    </div>
                </div>
                <Separator />
                <Tabs defaultValue="complete" className="flex-1">
                    <div className="container h-full py-6">
                        <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
                            <div className="hidden flex-col space-y-4 sm:flex md:order-2">
                                <div className="grid gap-2">
                                    <HoverCard openDelay={200}>
                                        <HoverCardTrigger asChild>
                                            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Mode
                                            </span>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-[320px] text-sm" side="left">
                                            Choose the interface that best suits your task. You can
                                            provide: a simple prompt to complete, starting and ending
                                            text to insert a completion within, or some text with
                                            instructions to edit it.
                                        </HoverCardContent>
                                    </HoverCard>
                                    <TabsList className="grid grid-cols-3">
                                        <TabsTrigger value="complete">
                                            <span className="sr-only">Complete</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                className="h-5 w-5"
                                            >
                                                <rect
                                                    x="4"
                                                    y="3"
                                                    width="12"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="4"
                                                    y="7"
                                                    width="12"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="4"
                                                    y="11"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="4"
                                                    y="15"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="8.5"
                                                    y="11"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="8.5"
                                                    y="15"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="13"
                                                    y="11"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                            </svg>
                                        </TabsTrigger>
                                        <TabsTrigger value="insert" disabled={!presets?.length}>
                                            <span className="sr-only">Insert</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                className="h-5 w-5"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M14.491 7.769a.888.888 0 0 1 .287.648.888.888 0 0 1-.287.648l-3.916 3.667a1.013 1.013 0 0 1-.692.268c-.26 0-.509-.097-.692-.268L5.275 9.065A.886.886 0 0 1 5 8.42a.889.889 0 0 1 .287-.64c.181-.17.427-.267.683-.269.257-.002.504.09.69.258L8.903 9.87V3.917c0-.243.103-.477.287-.649.183-.171.432-.268.692-.268.26 0 .509.097.692.268a.888.888 0 0 1 .287.649V9.87l2.245-2.102c.183-.172.432-.269.692-.269.26 0 .508.097.692.269Z"
                                                    fill="currentColor"
                                                ></path>
                                                <rect
                                                    x="4"
                                                    y="15"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="8.5"
                                                    y="15"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="13"
                                                    y="15"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                            </svg>
                                        </TabsTrigger>
                                        <TabsTrigger value="edit" disabled>
                                            <span className="sr-only">Edit</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                className="h-5 w-5"
                                            >
                                                <rect
                                                    x="4"
                                                    y="3"
                                                    width="12"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="4"
                                                    y="7"
                                                    width="12"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="4"
                                                    y="11"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="4"
                                                    y="15"
                                                    width="4"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <rect
                                                    x="8.5"
                                                    y="11"
                                                    width="3"
                                                    height="2"
                                                    rx="1"
                                                    fill="currentColor"
                                                ></rect>
                                                <path
                                                    d="M17.154 11.346a1.182 1.182 0 0 0-1.671 0L11 15.829V17.5h1.671l4.483-4.483a1.182 1.182 0 0 0 0-1.671Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <ModelSelector types={types} models={models} />
                                <TemperatureSelector />
                                <MaxLengthSelector />
                                <TopPSelector />
                                <div className="flex items-center">
                                    <Label htmlFor="flash-message" className="flex items-center gap-2 text-xs font-normal">
                                        <Switch id="flash-message" checked={isTask} onCheckedChange={setIsTask} /> Task Process
                                    </Label>
                                </div>
                            </div>
                            <div className="lg:max-h-[600px] md:order-1">
                                <TabsContent value="complete" className="mt-0 border-0 p-0">
                                    <div className="flex h-full flex-col space-y-4">
                                        <div className="flex h-full flex-col space-y-4">
                                            <RichEditor
                                                placeholder="What is this content about?"
                                                value={preset.systemBehavior}
                                                onChange={e => setPreset({ ...preset, systemBehavior: e })}
                                            // {...field}
                                            />

                                            {selectedPreset &&
                                                <div className="flex items-center space-x-2">
                                                    <Button onClick={() => handleSavePreset()}>Update</Button>
                                                    {/*   <Button variant="secondary">
                        <span className="sr-only">Show history</span>
                        <RotateCcw />
                      </Button> */}
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="insert" className="mt-0 border-0 p-0">
                                    <div className="flex flex-col space-y-4  max-h-[600px]">
                                        <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                                            <Textarea
                                                placeholder="We're writing to [inset]. Congrats from OpenAI!"
                                                className=" lg:min-h-[600px] xl:min-h-[700px]"
                                                value={userMessage}
                                                onChange={(e) => setUserMessage(e.target.value)}
                                            />
                                            <div className="rounded-md border h-full overflow-scroll min-h-[300px] lg:max-h-[700px] lg:min-h-[500px] xl:min-h-[500px]">
                                                <CardsChat messages={messages} setMessages={setMessages} />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button disabled={isLoading} onClick={() => handleMessageSubmit()}>Submit</Button>
                                            <Button disabled={isLoading} variant="secondary" onClick={() => getConversations()}>
                                                <span className="sr-only">Show history</span>
                                                <RotateCcw />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="edit" className="mt-0 border-0 p-0">
                                    <div className="flex flex-col space-y-4">
                                        <div className="grid h-full gap-6 lg:grid-cols-2">
                                            <div className="flex flex-col space-y-4">
                                                <div className="flex flex-1 flex-col space-y-2">
                                                    <Label htmlFor="input">Input</Label>
                                                    <Textarea
                                                        id="input"
                                                        placeholder="We is going to the market."
                                                        className="flex-1 lg:min-h-[580px]"
                                                    />
                                                </div>
                                                <div className="flex flex-col space-y-2">
                                                    <Label htmlFor="instructions">Instructions</Label>
                                                    <Textarea
                                                        id="instructions"
                                                        placeholder="Fix the grammar."
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-[21px] min-h-[400px] rounded-md border bg-muted lg:min-h-[700px]" />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button>Submit</Button>
                                            <Button variant="secondary">
                                                <span className="sr-only">Show history</span>
                                                <RotateCcw />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
