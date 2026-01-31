import React, { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function ProductGallery({ images }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    if (thumbApi) thumbApi.scrollTo(emblaApi.selectedScrollSnap());
  }, [emblaApi, thumbApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const thumbs = useMemo(() => images ?? [], [images]);

  return (
    <div className="pp-gallery">
      <div className="pp-embla" ref={emblaRef}>
        <div className="pp-emblaContainer">
          {images.map((img, idx) => (
            <div className="pp-emblaSlide" key={idx}>
              <img className="pp-mainImg" src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      </div>

      <div className="pp-thumbRow">
        <button
          className="pp-thumbNav"
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous image"
        >
          ‹
        </button>

        <div className="pp-emblaThumbs" ref={thumbRef}>
          <div className="pp-emblaThumbsContainer">
            {thumbs.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={"pp-thumb" + (idx === selectedIndex ? " isActive" : "")}
                onClick={() => emblaApi?.scrollTo(idx)}
                aria-label={`View image ${idx + 1}`}
              >
                <img className="pp-thumbImg" src={img.src} alt={img.alt} />
              </button>
            ))}
          </div>
        </div>

        <button
          className="pp-thumbNav"
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next image"
        >
          ›
        </button>
      </div>
    </div>
  );
}
