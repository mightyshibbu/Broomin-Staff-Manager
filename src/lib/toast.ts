import { useToast } from "@/components/ui/use-toast"
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"

export function useToaster() {
  const { toast } = useToast()

  return {
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
      })
    },
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      })
    },
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
      })
    },
  }
}

export { Toast, ToastProvider, ToastViewport }
