import { AdvancedImage } from '@cloudinary/react'
import { Cloudinary } from '@cloudinary/url-gen'
import { fill, limitFit } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'
import { resolveContentImage } from './content'

const cld = new Cloudinary({ cloud: { cloudName: 'dbyjbsq43' } })

type ContentImageProps = {
  source: string
  alt: string
  className?: string
  mode?: 'card' | 'detail' | 'preview'
}

export default function ContentImage({
  source,
  alt,
  className,
  mode = 'card',
}: ContentImageProps) {
  if (!source.startsWith('susana-riquelme/catalogo/')) {
    return (
      <img
        className={className}
        src={resolveContentImage(source)}
        alt={alt}
        loading={mode === 'detail' ? 'eager' : 'lazy'}
      />
    )
  }

  const image = cld
    .image(source)
    .format('auto')
    .quality('auto')

  if (mode === 'card') {
    image.resize(fill().gravity(autoGravity()).width(900).height(900))
  } else {
    image.resize(limitFit().width(1400).height(1400))
  }

  return (
    <AdvancedImage
      className={className}
      cldImg={image}
      alt={alt}
      loading={mode === 'detail' ? 'eager' : 'lazy'}
    />
  )
}
