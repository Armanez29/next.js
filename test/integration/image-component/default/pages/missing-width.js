import React from 'react'
import Image from 'next/image'

const Page = () => {
  return (
    <div>
      <p>Hello World</p>
      <Image id="unsized-image" src="/test.png" unsized></Image>
      <p id="stubtext">This is the index page</p>
    </div>
  )
}

export default Page
