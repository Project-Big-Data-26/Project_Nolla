import { useState } from "react";
import { Star } from "lucide-react";
import API from "../api/axios";
import Modal from "./Modal";

const MAX_COMMENT_LENGTH = 500;

const AssessmentFeedbackModal = ({ target, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!rating) {
      setError("Pilih penilaian bintang terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await API.post("/assessment-feedback", {
        assessment_type: target.assessmentType,
        attempt_id: target.attemptId,
        rating,
        comment: comment.trim(),
      });
      onSubmitted();
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        onSubmitted();
        return;
      }
      setError(
        requestError.response?.data?.message ||
          "Masukan belum berhasil dikirim. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg" scrollable>
      <form onSubmit={submitFeedback} className="pr-1">
        <div className="mb-5 pr-8 sm:mb-6">
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Bagaimana pengalamanmu?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Masukanmu membantu kami meningkatkan kualitas sistem Nolla.
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-bold text-slate-800">
            Penilaian pengalaman <span className="text-rose-600">*</span>
          </legend>
          <div
            className="mt-2 grid w-full grid-cols-5 gap-2 sm:gap-3"
            role="radiogroup"
            aria-label="Penilaian pengalaman, 1 sampai 5 bintang"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} dari 5 bintang`}
                onClick={() => {
                  setRating(value);
                  setError("");
                }}
                className="flex h-11 w-full items-center justify-center rounded-xl text-amber-500 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-12"
              >
                <Star
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  fill={rating >= value ? "currentColor" : "none"}
                  strokeWidth={1.8}
                />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5">
          <label
            htmlFor="assessment-feedback-comment"
            className="text-sm font-bold text-slate-800"
          >
            Saran atau komentar
          </label>
          <textarea
            id="assessment-feedback-comment"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))
            }
            maxLength={MAX_COMMENT_LENGTH}
            rows={4}
            placeholder="Tuliskan saranmu di sini..."
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 sm:px-4"
          />
          <p className="mt-1 text-right text-xs text-slate-500">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="order-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:order-1"
          >
            Nanti saja
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="order-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
          >
            {isSubmitting ? "Mengirim..." : "Kirim masukan"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssessmentFeedbackModal;
