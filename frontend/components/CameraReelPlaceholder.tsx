type ReelImage = {
  src: string
  title: string
}

const REEL_IMAGES: ReelImage[] = [
  { src: '/assets/fashion-reel/look-1.jpg', title: 'Monochrome Tailoring' },
  { src: '/assets/fashion-reel/look-2.jpg', title: 'Street Atelier Layering' },
  { src: '/assets/fashion-reel/look-3.jpg', title: 'Luxe Night Editorial' },
  { src: '/assets/fashion-reel/look-4.jpg', title: 'Paris Runway Pulse' },
  { src: '/assets/fashion-reel/look-5.jpg', title: 'Structured Silhouette Study' },
  { src: '/assets/fashion-reel/look-6.jpg', title: 'High Contrast Utility' },
  { src: '/assets/fashion-reel/look-7.jpg', title: 'Modern Couture Motion' },
  { src: '/assets/fashion-reel/look-8.jpg', title: 'Heritage x Future Blend' }
]

const LOOP_IMAGES = [...REEL_IMAGES, ...REEL_IMAGES]

export default function CameraReelPlaceholder() {
  return (
    <section className="camera-reel-placeholder" aria-label="Moving fashion camera reel showcase">
      <div className="camera-reel-head">
        <p className="camera-reel-label">Live Camera Reel</p>
        <p className="camera-reel-meta">Continuous fashion feed // right to left loop</p>
      </div>

      <div className="camera-reel-window">
        <div className="camera-reel-track">
          {LOOP_IMAGES.map((image, index) => (
            <figure className="camera-frame" key={`${image.src}-${index}`}>
              <img className="camera-frame-image" src={image.src} alt={image.title} loading="lazy" />
              <figcaption className="camera-frame-caption">{image.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <style jsx>{`
        .camera-reel-placeholder {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01)),
            linear-gradient(110deg, rgba(0, 229, 255, 0.08), rgba(0, 0, 0, 0.2));
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.56);
        }

        .camera-reel-placeholder::before,
        .camera-reel-placeholder::after {
          content: '';
          position: absolute;
          left: 0;
          width: 100%;
          height: 20px;
          z-index: 2;
          background-image: radial-gradient(circle, rgba(0, 0, 0, 0.9) 39%, transparent 41%);
          background-size: 18px 18px;
          background-position: center;
          background-color: rgba(4, 4, 6, 0.9);
        }

        .camera-reel-placeholder::before {
          top: 0;
        }

        .camera-reel-placeholder::after {
          bottom: 0;
        }

        .camera-reel-head {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 2rem 1.2rem 0.9rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .camera-reel-label {
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.95);
        }

        .camera-reel-meta {
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.17em;
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.62);
        }

        .camera-reel-window {
          position: relative;
          overflow: hidden;
          padding: 1rem 0 2.2rem;
        }

        .camera-reel-track {
          display: flex;
          align-items: stretch;
          gap: 1rem;
          width: max-content;
          padding: 0 1rem;
          will-change: transform;
          animation: camera-reel-scroll 34s linear infinite;
        }

        .camera-frame {
          width: clamp(220px, 24vw, 360px);
          margin: 0;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(3, 3, 4, 0.92);
        }

        .camera-frame-image {
          display: block;
          width: 100%;
          height: clamp(160px, 18vw, 240px);
          object-fit: cover;
          filter: saturate(1.08) contrast(1.03);
        }

        .camera-frame-caption {
          padding: 0.72rem;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.82);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes camera-reel-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (max-width: 840px) {
          .camera-reel-head {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.35rem;
            padding: 1.8rem 1rem 0.8rem;
          }

          .camera-reel-window {
            padding-bottom: 2rem;
          }

          .camera-frame {
            width: clamp(200px, 62vw, 290px);
          }

          .camera-frame-image {
            height: clamp(145px, 44vw, 210px);
          }
        }
      `}</style>
    </section>
  )
}
