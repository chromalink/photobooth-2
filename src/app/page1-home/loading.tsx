'use client'

export default function Loading() {
  return (
    <div className="loading-container">
      <style jsx>{`
        .loading-container {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: black;
          z-index: 1000;
        }
      `}</style>
    </div>
  )
}
