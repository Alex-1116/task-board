import { getBoards, getBoardById } from '@/lib/actions'
import { redirect } from 'next/navigation'
import CreateBoardDialog from '@/components/CreateBoardDialog'
import BoardSwitcher from '@/components/BoardSwitcher'
import BoardView from '@/components/BoardView'

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const boards = await getBoards()

  if (boards.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Task Board</h1>
          <p className="text-muted-foreground">Create your first board to get started</p>
          <CreateBoardDialog />
        </div>
      </div>
    )
  }

  const boardId = searchParams.boardId as string
  if (!boardId || !boards.find(b => b.id === boardId)) {
    redirect(`/?boardId=${boards[0].id}`)
  }

  const currentBoard = await getBoardById(boardId)
  if (!currentBoard) {
    redirect(`/?boardId=${boards[0].id}`)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Task Board</h1>
          <BoardSwitcher boards={boards} currentBoardId={boardId} />
        </div>
        <div className="flex items-center gap-2">
          {/* Header actions */}
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <BoardView board={currentBoard} />
      </main>
    </div>
  )
}
