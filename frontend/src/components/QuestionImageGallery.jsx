import QuestionImage from "./QuestionImage";

const QuestionImageGallery = ({ images = [], onFail }) => {
  const hasMultipleImages = images.length > 1;
  const isSingleImage = images.length === 1;

  return (
    <div
      className={
        hasMultipleImages
          ? "no-scrollbar grid h-full w-full grid-cols-2 auto-rows-fr gap-2 overflow-y-auto p-2 sm:gap-3 sm:p-3"
          : isSingleImage
            ? "flex h-full w-full items-center justify-center p-2 sm:p-3"
            : "no-scrollbar flex h-full w-full flex-col items-center gap-3 overflow-y-auto p-3 sm:p-4"
      }
    >
      {images.map((src) => (
        <div
          key={src}
          className={
            hasMultipleImages
              ? "flex min-h-0 min-w-0 items-center justify-center p-1"
              : isSingleImage
                ? "flex h-full min-h-0 w-full items-center justify-center"
                : "flex h-[180px] w-full flex-none items-center justify-center p-2 sm:h-[220px]"
          }
        >
          <QuestionImage
            src={src}
            onFail={onFail}
            alt="Ilustrasi Soal"
            className={
              hasMultipleImages
                ? "h-[92%] max-h-[140px] w-[92%] max-w-full object-contain sm:max-h-[190px]"
                : isSingleImage
                  ? "h-[92%] max-h-full w-[92%] max-w-full object-contain"
                  : "h-[92%] max-h-full w-[92%] max-w-full object-contain"
            }
          />
        </div>
      ))}
    </div>
  );
};

export default QuestionImageGallery;
