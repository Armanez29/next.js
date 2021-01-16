import Link from 'next/link'

function Index() {
  return (
    <>
      <h3>Hi 👋</h3>
      <Link href="/a-non-existing-page">
        <a>a link to no-where</a>
      </Link>
    </>
  )
}

Index.getInitialProps = () => {
  if (typeof window !== 'undefined') {
    throw new Error('foo')
  }
  return {}
}

export default Index
