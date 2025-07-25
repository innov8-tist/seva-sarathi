import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: Index,
})

export default function Index() {

    return (
        "Hii"
    )
  }
  
