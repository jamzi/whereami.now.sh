import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCopyTextHandler } from 'actionsack'

export const useGeoPosition = positionOptions => {
  const [position, setPosition] = React.useState(null)

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      positionUpdate => {
        if (positionUpdate) {
          setPosition(positionUpdate)
        }
      },
      console.error,
      positionOptions
    )
  }, [positionOptions])

  React.useEffect(() => {
    const listener = navigator.geolocation.watchPosition(
      positionUpdate => {
        if (positionUpdate) {
          setPosition(positionUpdate)
        }
      },
      console.error,
      positionOptions
    )

    return () => navigator.geolocation.clearWatch(listener)
  }, [positionOptions])

  return position
}

const opts = { enableHighAccuracy: true }

function fixed(x, n) {
  return Number(x).toFixed(n)
}
function hex(x) {
  return Math.floor(x)
    .toString(16)
    .padStart(6, '0')
}
function Home(props) {
  const geoPosition = useGeoPosition(opts)
  const position = props.initialPosition || geoPosition

  let color1
  let color2
  if (position) {
    color1 = hex((Number(position.coords.latitude) + 90) * (16777215 / 180))
    color2 = hex((Number(position.coords.longitude) + 180) * (16777215 / 360))
  }

  const ref = React.useRef('')
  const router = useRouter()
  React.useEffect(() => {
    if (position) {
      const newPath = `/${position.coords.latitude},${position.coords.longitude}`
      if (router.asPath !== newPath) {
        router.replace(router.asPath, newPath, { shallow: true })
      }
    }
  }, [position, router])

  React.useEffect(() => {
    ref.current = window.location.toString()
  }, [router.asPath])

  const { onClick, copied } = useCopyTextHandler(ref.current)

  return (
    <div className="container">
      <Head>
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Where am I right now?" />
      </Head>
      <button className="share" onClick={onClick}>
        {copied ? 'Copied!' : 'Share'}
      </button>
      <div className="circle">
        {position ? (
          <div className="text">
            <div className="coord">{fixed(position.coords.latitude, 8)}</div>
            <div className="coord">{fixed(position.coords.longitude, 8)}</div>
          </div>
        ) : (
          <div className="text">Loading...</div>
        )}
      </div>
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
          button {
            position: absolute;
            appearance: none;
            border: 2px solid #111;
            background: transparent;
            top: 1rem;
            right: 2rem;
            font-size: 24px;
            color: #111;
            border-radius: 4px;
            cursor: pointer;
            outline-color: white;
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
          .coord {
            font-variant-numeric: tabular-nums;
            text-shadow: 0 1px 0 black;
          }

          @media (max-width: 960px) {
            .text {
              font-size: 36px;
            }
            button {
              top: 1rem;
              right: 1rem;
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
              ? `linear-gradient(${(position && position.coords && position.coords.heading) ||
                  '90'}deg, #${color1}, #${color2});`
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
