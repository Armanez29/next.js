import { useRouter } from 'next/router'

export default () => {
  const router = useRouter()
  const searchParam = router.query.q
  return (
    <p>
      made it to dashboard
      {!!searchParam && (
        <>
          <br />
          query param: {searchParam}
        </>
      )}
    </p>
  )
}
