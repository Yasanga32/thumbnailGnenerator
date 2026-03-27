import React from 'react'
import {yt_html} from '../assets/assets'
import { useSearchParams } from 'react-router-dom'

function YtPreview() {

  const [searchParams] = useSearchParams()

  const thumbnail = searchParams.get('thumbnail_url') || ''
  const title = searchParams.get('title') || ''

  const new_html = yt_html.replace("%%THUMBNAIL_URL%%", thumbnail).replace
  ("%%TITLE%%", title);

  return (
    <div className='fixed inset-0 z-100 bg-black'>
      <iframe srcDoc={new_html} width="100%" height="100%"
      allowFullScreen></iframe>
    </div>
  )
}

export default YtPreview