import Image from 'next/image'
const DEFAULT_QUALITY = 20;

const dotCmsLoader = (props) => {
  return `${process.env.NEXT_PUBLIC_DOTCMS_HOST}${getUrlWithResizingParameters(props)}`

}

const DotCmsImage = (params) => {
  const {height, src} = params
  if (!src) {
    return (
      <div
        className="w-full bg-gradient-to-tr from-[#576BE8] to-[#1B3359]"
        style={{
          minHeight: height
        }}
      ></div>
    )
  }

  return <Image
            {...params }
            loader={dotCmsLoader}
          />
}

// https://dotcms.com/docs/latest/image-resizing-and-processing
const getUrlWithResizingParameters = ({src, width, quality = DEFAULT_QUALITY}) => {
  const urlParams = [];
  const lastSeparatorIdx = src.lastIndexOf('/');
  const imageIdentifierAndField = src.slice(0, lastSeparatorIdx);

  urlParams.push(imageIdentifierAndField);
  urlParams.push(width + 'w');
  urlParams.push(quality + 'q');

  return urlParams.join('/');
}

export default DotCmsImage
