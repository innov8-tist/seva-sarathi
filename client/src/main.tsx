import { StrictMode } from 'react'
import './index.css'
import ReactDOM from "react-dom/client"
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'


const queryClient = new QueryClient()
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>
        </RouterProvider>
        </QueryClientProvider>
    </StrictMode>,
)


