import graphqlFetch from './graphql-fetch'

const RootFields = `
  fragment RootFields on QueryRoot {
    shop {
      name
    }
    pages(first: 100) {
      edges {
        node {
          title
          handle
        }
      }
    }
  }
`

const ProductFields = `
  fragment ProductFields on Product {
    id
    handle
    title
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 100) {
      edges {
        node {
          altText
          originalSrc
          transformedSrc(maxHeight: $maxHeight, maxWidth: $maxWidth, crop: CENTER)
        }
      }
    }
  }
`

const VariantFields = `
  fragment VariantFields on ProductVariant {
    id
    title
    priceV2 {
      amount
      currencyCode
    }
    compareAtPriceV2 {
      amount
      currencyCode
    }
    selectedOptions {
      name
      value
    }
    image {
      altText
      originalSrc
      transformedSrc(maxHeight: $maxHeight, maxWidth: $maxWidth, crop: CENTER)
    }
  }
`

export async function getShopDataForHome() {
  const data = await graphqlFetch(`
    query Products($maxWidth: Int = 384, $maxHeight: Int = 384) {
      ...RootFields
      products(first: 10) {
        edges {
          node {
            ...ProductFields
            variants(first: 10) {
              edges {
                node {
                  ...VariantFields
                }
              }
            }
          }
        }
      }
    }
    ${RootFields}
    ${ProductFields}
    ${VariantFields}
  `)

  return data
}

export async function getAllProductsWithSlug() {
  const data = await graphqlFetch(`
    {
      products(first: 250) {
        edges {
          node {
            handle
          }
        }
      }
    }
  `)

  return data.products
}

export async function getProductAndMoreProducts(handle) {
  const { shop, pages, productByHandle: product } = await graphqlFetch(
    `
      query ProductAndMoreProducts($handle: String!, $maxWidth: Int = 600, $maxHeight: Int = 600) {
        ...RootFields
        productByHandle(handle: $handle) {
          ...ProductFields
          descriptionHtml
          variants(first: 100) {
            edges {
              node {
                ...VariantFields
              }
            }
          }
        }
      }
      ${RootFields}
      ${ProductFields}
      ${VariantFields}
    `,
    { variables: { handle } }
  )

  // NOTE: for example purposes we fetch the list of products instead of related product
  // recommendations because there is not enough data to build up the recommendations.
  // In a real world application feel free to use the query below instead
  //
  // const additionalData =
  //   product &&
  //   (await graphqlFetch(
  //     `
  //       query ProductRecommendations($productId: ID!, $maxWidth: Int = 384, $maxHeight: Int = 384) {
  //         productRecommendations(productId: $productId) {
  //           ...ProductFields
  //           descriptionHtml
  //           variants(first: 10) {
  //             edges {
  //               node {
  //                 ...VariantFields
  //               }
  //             }
  //           }
  //         }
  //       }
  //       ${ProductFields}
  //       ${VariantFields}
  //     `,
  //     { variables: { productId: product.id } }
  //   ))
  // const relatedProducts = additionalData?.productRecommendations.slice(0, 3) ?? []

  const additionalData =
    product &&
    (await graphqlFetch(
      `
        query ProductRecommendations($maxWidth: Int = 384, $maxHeight: Int = 384) {
          products(first: 4) {
            edges {
              node {
                ...ProductFields
                variants(first: 10) {
                  edges {
                    node {
                      ...VariantFields
                    }
                  }
                }
              }
            }
          }
        }
        ${ProductFields}
        ${VariantFields}
      `
    ))
  const relatedProducts =
    additionalData?.products.edges
      .filter(({ node }) => node.handle !== handle)
      .slice(0, 3) ?? []

  return { shop, pages, product, relatedProducts }
}

export async function getPageData(handle) {
  const data = await graphqlFetch(
    `
      query Page($handle: String!) {
        ...RootFields
        pageByHandle(handle: $handle) {
          title
          handle
          body
        }
      }
      ${RootFields}
    `,
    { variables: { handle } }
  )

  return data
}

export async function getAllPagesHandles() {
  const data = await graphqlFetch(`
    {
      pages(first: 100) {
        edges {
          node {
            handle
          }
        }
      }
    }
  `)

  return data.pages
}
