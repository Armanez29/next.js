import { useRef, useState } from 'react'
import * as UpChunk from '@mux/upchunk'
import Button from './button'

const UploadForm = ({ uploadUrl, onStart, onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef(null)

  const startUpload = () => {
    onStart()
    setIsUploading(true)
    const upload = UpChunk.createUpload({
      endpoint: uploadUrl,
      file: inputRef.current.files[0],
    })

    upload.on('error', err => {
      console.error('💥 🙀', err.detail)
      setErrorMessage(err.detail)
    })

    upload.on('progress', progress => {
      setProgress(progress.detail)
    })

    upload.on('success', () => {
      onSuccess()
    })
  }

  if (errorMessage) return <div>{errorMessage}</div>

  return (
    <div>
      {isUploading ? (
        <div>Uploading...{progress ? `${progress}%` : ''}</div>
      ) : (
        <>
          <label>
            <Button type="button" onClick={() => inputRef.current.click()}>
              Select a video file
            </Button>
            <input type="file" onChange={startUpload} ref={inputRef} />
          </label>
          <style jsx>{`
            input {
              display: none;
            }
          `}</style>
        </>
      )}
    </div>
  )
}

export default UploadForm
