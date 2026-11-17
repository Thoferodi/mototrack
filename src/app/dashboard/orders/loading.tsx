import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoadingOrders() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} className="bg-muted/30 rounded-lg p-3 space-y-4">
            <Skeleton className="h-6 w-24 mb-4" />
            {[1, 2].map((card) => (
              <Card key={card} className="border-none shadow-none bg-background">
                <CardHeader className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
