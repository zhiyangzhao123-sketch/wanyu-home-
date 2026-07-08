import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./GalleryAlbum.css";

export interface GalleryPhoto {
  src: string;
  thumbSrc: string;
  width: number;
  height: number;
  caption?: string;
  date?: string;
}

interface GalleryAlbumProps {
  photos: GalleryPhoto[];
}

export default function GalleryAlbum({ photos }: GalleryAlbumProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isOpen = activeIndex !== null;
  const currentPhoto = isOpen ? photos[activeIndex] : null;

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showPhoto = useCallback(
    (index: number) => {
      if (photos.length === 0) return;
      setActiveIndex(index);
    },
    [photos.length],
  );

  const showPrevious = useCallback(() => {
    if (activeIndex === null || photos.length === 0) return;
    setActiveIndex((activeIndex - 1 + photos.length) % photos.length);
  }, [activeIndex, photos.length]);

  const showNext = useCallback(() => {
    if (activeIndex === null || photos.length === 0) return;
    setActiveIndex((activeIndex + 1) % photos.length);
  }, [activeIndex, photos.length]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeLightbox, showPrevious, showNext]);

  if (photos.length === 0) {
    return <p className="gallery-album__empty">這本相冊還沒有照片。</p>;
  }

  return (
    <>
      <ul className="gallery-album__list">
        {photos.map((photo, index) => (
          <li key={`${photo.src}-${index}`} className="gallery-album__item">
            <button
              type="button"
              className="gallery-album__photo-btn"
              onClick={() => showPhoto(index)}
              aria-label={
                photo.caption
                  ? `查看照片：${photo.caption}`
                  : `查看第 ${index + 1} 張照片`
              }
            >
              <span className="gallery-album__polaroid">
                <span className="gallery-album__photo-frame">
                  <img
                    src={photo.thumbSrc}
                    alt={photo.caption ?? ""}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="gallery-album__photo"
                  />
                </span>
                {(photo.caption || photo.date) && (
                  <span className="gallery-album__strip">
                    {photo.caption && (
                      <span className="gallery-album__caption">{photo.caption}</span>
                    )}
                    {photo.date && (
                      <span className="gallery-album__date">{photo.date}</span>
                    )}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {isOpen && currentPhoto && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="照片預覽"
          onClick={closeLightbox}
        >
          <div
            className="gallery-lightbox__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="gallery-lightbox__close"
              onClick={closeLightbox}
              aria-label="關閉預覽"
            >
              <X size={22} strokeWidth={1.75} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="gallery-lightbox__nav gallery-lightbox__nav--prev"
              onClick={showPrevious}
              aria-label="上一張"
            >
              <ChevronLeft size={24} strokeWidth={1.75} aria-hidden="true" />
            </button>

            <figure className="gallery-lightbox__figure" key={activeIndex}>
              <img
                src={currentPhoto.src}
                alt={currentPhoto.caption ?? ""}
                width={currentPhoto.width}
                height={currentPhoto.height}
                className="gallery-lightbox__image"
              />
              {(currentPhoto.caption || currentPhoto.date) && (
                <figcaption className="gallery-lightbox__caption">
                  {currentPhoto.caption && <span>{currentPhoto.caption}</span>}
                  {currentPhoto.date && (
                    <span className="gallery-lightbox__date">{currentPhoto.date}</span>
                  )}
                </figcaption>
              )}
            </figure>

            <button
              type="button"
              className="gallery-lightbox__nav gallery-lightbox__nav--next"
              onClick={showNext}
              aria-label="下一張"
            >
              <ChevronRight size={24} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
