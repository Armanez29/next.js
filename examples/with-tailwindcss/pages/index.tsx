import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App With Tailwind</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="h-full w-full p-16 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold font-roboto">
          Welcome to <a className="next-blue" href="https://nextjs.org">Next.js!</a>
        </span>
        <span>
          Get started by editing&nbsp; <code>pages/index.tsx</code>
        </span>
      </div>
    </>
  )
}