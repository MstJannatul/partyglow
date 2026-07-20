import Header from '@/components/layout/Header'
import { MessageInbox } from '@/components/messaging/MessageInbox'

const Messages = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="container mx-auto flex-1 p-4">
        <div className="h-[calc(100dvh-120px)] rounded-lg border bg-card md:h-[calc(100vh-120px)]">
          <MessageInbox />
        </div>
      </main>
    </div>
  )
}

export default Messages
