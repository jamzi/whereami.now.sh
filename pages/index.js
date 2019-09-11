import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCopyTextHandler, useKeyboardListener } from 'actionsack'
import domToImage from 'dom-to-image'
import retinaDomToImage from 'retina-dom-to-image'

export const useGeoPosition = positionOptions => {
  const [position, setPosition] = React.useState(null)

  React.useEffect(() => {
    function update(positionUpdate) {
      if (positionUpdate) {
        setPosition(positionUpdate)
      }
    }

    navigator.geolocation.getCurrentPosition(update, console.error, positionOptions)
    const listener = navigator.geolocation.watchPosition(update, console.error, positionOptions)

    return () => navigator.geolocation.clearWatch(listener)
  }, [positionOptions])

  return position
}

function fixed(x, n) {
  return Number(x).toFixed(n)
}

function hex(x) {
  return Math.floor(x)
    .toString(16)
    .padStart(6, '0')
}

function download(e, filterList = ['share'], square) {
  const options = {
    filter: n => {
      if (n.className && filterList.some(c => String(n.className).indexOf(c) > -1)) {
        return false
      }
      return true
    }
  }
  if (square) {
    options.width = document.body.clientWidth
    options.height = document.body.clientWidth
    return domToImage
      .toBlob(document.body, options)
      .then(data => window.URL.createObjectURL(data))
      .then(url => {
        const link = document.createElement('a')
        link.download = `whereiam.now.png`
        link.href = url
        document.body.appendChild(link)
        link.click()
        link.remove()
      })
  }
  return retinaDomToImage
    .toBlob(document.body, options)
    .then(data => window.URL.createObjectURL(data))
    .then(url => {
      const link = document.createElement('a')
      link.download = `whereiam.now.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      link.remove()
    })
}

function clamp(n, min, max) {
  return Math.min(Math.max(Number(n), min), max)
}

const opts = { enableHighAccuracy: true }

function Home(props) {
  const geoPosition = useGeoPosition(opts)
  const position = props.initialPosition || geoPosition

  let color1
  let color2
  if (position) {
    color1 = hex((clamp(position.coords.latitude, -90, 90) + 90) * (16777215 / 180))
    color2 = hex((clamp(position.coords.longitude, -180, 180) + 180) * (16777215 / 360))
  }

  const router = useRouter()
  React.useEffect(() => {
    if (position) {
      if (router.asPath === '/') {
        const newPath = `/${position.coords.latitude},${position.coords.longitude}`
        router.replace(router.asPath, newPath, { shallow: true })
      }
    }
  }, [position, router])

  const ref = React.useRef('')
  const { onClick, copied } = useCopyTextHandler(ref.current)

  const [message, setMessage] = React.useState('Loading...')

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMessage('Geolocation is not supported in your browser')
    }
  }, [])

  const degree = clamp(position && position.coords && position.coords.heading, 0, 360) || 90

  useKeyboardListener('e', e => {
    if (e.metaKey && e.shiftKey) {
      download(e, ['share', 'container'], true)
    }
  })

  return (
    <div className="container">
      <Head>
        <title>Where am I now? jo</title>
        <meta name="description" content="Find out where you are on this place we call Earth" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Where am I now?" />
      </Head>
      <div className="share-buttons">
        <button
          className="share"
          onClick={() => {
            ref.current = window.location.toString()
            onClick()
          }}
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button className="share" onClick={download}>
          Download
        </button>
      </div>
      <div className="circle">
        {position ? (
          <div className="text">
            <div className="coord">{fixed(position.coords.latitude, 8)}</div>
            <div className="coord">{fixed(position.coords.longitude, 8)}</div>
          </div>
        ) : (
          <div className="text message">{message}</div>
        )}
      </div>
      <footer className="share">
        <a
          href="https://github.com/mfix22/whereami.now.sh"
          target="_blank"
          rel="noopener noreferrer"
        >
          source
        </a>
      </footer>
      <style jsx>
        {`
          .container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
          }

          .share-buttons {
            position: absolute;
            top: 1rem;
            right: 1rem;
          }

          footer {
            position: absolute;
            bottom: 1rem;
            right: 1rem;
          }
          footer a {
            color: black;
            font-size: 20px;
            outline-color: white;
          }

          button {
            appearance: none;
            border: 2px solid #111;
            background: transparent;
            font-size: 24px;
            color: #111;
            border-radius: 4px;
            cursor: pointer;
            outline-color: white;
            margin-right: 0.5rem;
          }
          .circle {
            border-radius: 50%;
            border: 8px solid white;
            width: 80vh;
            height: 80vh;
            max-width: 80vw;
            max-height: 80vw;
          }
          .text {
            color: white;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 48px;
          }
          .message {
            text-align: center;
            max-width: 80%;
            margin: 0 auto;
          }
          .coord {
            font-variant-numeric: tabular-nums;
            text-shadow: 0 1px 0 black;
          }

          @media (max-width: 960px) {
            .text {
              font-size: 36px;
            }
          }
        `}
      </style>
      <style jsx global>
        {`
          body {
            margin: 0;
            padding: 0;
            background: black;
            background-image: ${color1 && color2
              ? `linear-gradient(${degree}deg, #${color1}, #${color2});`
              : 'black'};
            width: 100vw;
            height: 100vh;
            font-family: sans-serif;
          }
          html {
            overflow: hidden;
          }
        `}
      </style>
    </div>
  )
}

export default Home
