import { Toaster } from '@/components/ui/sonner';
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({  
  component: () => {
    return (
      <>
        <hr />
        <Outlet />
        <Toaster />
        <TanStackRouterDevtools />
      </>
    );
  },
})
