import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import dynamic from 'next/dynamic'
import { Avatar, Pagination } from '@nextui-org/react'

const CustomModel = dynamic(() => import('../components/Model'))
const CustomCheckbox = dynamic(() => import('../components/Checkbox'))
const CustomTable = dynamic(() => import('../components/Table'))
const CustomCollapse = dynamic(() => import('../components/Collapse'))

const Home: NextPage = () => {

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1>
          <Avatar text="Hi" color="gradient" textColor={'white'} size={'xl'} />
        </h1>
        <h1 className={styles.title}>
          Welcome to use <a href="https://nextui.org/">NextUI!</a>
        </h1>
        {/* model */}
        <h2>Modal:</h2>
        <CustomModel></CustomModel>
        {/* checkout */}
        <h2>Checkbox:</h2>
        <CustomCheckbox></CustomCheckbox>
        {/* table */}
        <h2>Table:</h2>
        <CustomTable></CustomTable>
        {/* pagination */}
        <h2>Pagination</h2>
        <Pagination total={20} initialPage={1} />
        {/* collapse */}
        <h2>Collapse</h2>
        <CustomCollapse></CustomCollapse>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
