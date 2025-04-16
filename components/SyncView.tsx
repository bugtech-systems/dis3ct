import { BellRing, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

const notifications = [
    {
        title: "Your call has been confirmed.",
        description: "1 hour ago",
    },
    {
        title: "You have a new message!",
        description: "1 hour ago",
    },
    {
        title: "Your subscription is expiring soon!",
        description: "2 hours ago",
    },
]

type CardProps = React.ComponentProps<typeof Card>

export function SyncView({ className, data, onBack }: any) {

    let newData = {};

    data.sort((a, b) => a.name.localeCompare(b.name)); // Sort by age ascending

    data.forEach(a => {
        newData[a._id] = newData[a._id] ? { ...newData[a._id], [a.sync]: true } : { name: a.name, [a.sync]: true }
    })

    let newSync = Object.entries(newData).map(([Key, value]) => {
        return { id: Key, ...value }
    })

    return (
        <>
            <CardContent className="grid gap-4">
                <ScrollArea className="h-72 w-full rounded-md border">
                    <div>
                        {newSync.map((doc, index) => (
                            <div
                                key={index}
                                className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                            >
                                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {doc.name}
                                    </p>
                                    <div className="w-full d-flex flex-row justify-around">
                                        {doc.image &&
                                            <i className="text-sm text-muted-foreground mr-10">
                                                Image
                                            </i>
                                        }
                                        {doc.biometric &&
                                            <i className="text-sm text-muted-foreground">
                                                Biometric
                                            </i>
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            {/*  <CardFooter>
                <Button className="w-full">
                    <Check /> Mark all as read
                </Button>
            </CardFooter> */}
        </>
    )
}
