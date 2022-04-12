export default async function handler(req, res) {
  // WARNING: don't use user input in production
  // make sure to use trusted value for revalidating
  let revalidated = false
  try {
    await res.unstable_revalidate(req.query.pathname, {
      unstable_ifGenerated: !!req.query.ifGenerated,
    })
    revalidated = true
  } catch (err) {
    console.error(err)
  }
  res.json({
    revalidated,
  })
}
