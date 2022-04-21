import DotCmsImage from './dotcms-image'
import Link from 'next/link'
import cn from 'classnames'

export default function CoverImage({ title, url, slug, height = 1000 }) {
  const image = (
    <DotCmsImage
      width={2000}
      height={height}
      alt={`Cover Image for ${title}`}
      className={cn('shadow-small', {
        'hover:shadow-medium transition-shadow duration-200': slug,
      })}
      src={url}
      quality={35}
      objectFit="cover"
    />
  )

  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/posts/${slug}`}>
          <a aria-label={title}>{image}</a>
        </Link>
      ) : (
        image
      )}
    </div>
  )
}
