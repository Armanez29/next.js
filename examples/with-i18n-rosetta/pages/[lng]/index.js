import Link from 'next/link'
import Head from 'next/head'
import useI18n from '../../hooks/use-i18n'
import { languages, contentLanguageMap } from '../../lib/i18n'

const HomePage = ({ lng, lngDict }) => {
  const i18n = useI18n({ lng, lngDict })

  return (
    <div>
      <Head>
        <meta
          httpEquiv="content-language"
          content={contentLanguageMap[i18n.activeLocale]}
        />
      </Head>
      <h1>{i18n.t('intro.welcome', { username: 'Peter' })}</h1>
      <h3>{i18n.t('intro.text')}</h3>
      <div>Current locale: {i18n.activeLocale}</div>
      <Link href="/de">
        <a>Use client-side routing to change language to 'de'</a>
      </Link>
    </div>
  )
}

export async function getStaticProps({ params }) {
  const { default: lngDict = {} } = await import(`../../locales/${params.lng}`)

  return {
    props: { lng: params.lng, lngDict },
  }
}

export async function getStaticPaths() {
  return {
    paths: languages.map(l => ({ params: { lng: l } })),
    fallback: true,
  }
}

export default HomePage
