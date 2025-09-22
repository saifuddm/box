import { Loader2 } from 'lucide-react'
import React from 'react'

export default function BoxLoading() {
  return (
    <div className='grid place-items-center h-screen'>
        <div className='flex flex-col gap-2'>
            <p className='text-2xl font-bold flex items-center gap-2'><Loader2 className="   animate-spin" /> Loading</p>
            <p className='text-sm text-muted-foreground'>This may take a while...</p>
        </div>
    </div>
  )
}
