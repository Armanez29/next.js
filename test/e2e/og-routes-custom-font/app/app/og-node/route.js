import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export async function GET() {
  const font = await fs.promises.readFile(
    path.join(fileURLToPath(import.meta.url), '../../../../assets/typewr__.ttf')
  )
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 88,
          background: '#fff',
          color: '#000',
        }}
      >
        Typewriter og
      </div>
    ),
    {
      fonts: [
        {
          name: 'Typewriter',
          data: font,
          style: 'normal',
        },
      ],
    }
  )
}
