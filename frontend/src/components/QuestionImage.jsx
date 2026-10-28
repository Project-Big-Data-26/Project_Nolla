import React, { useEffect, useState } from "react";
import API from "../api/axios";

const QuestionImage = ({ src, alt = "Ilustrasi Soal", className = "", onFail }) => {
  const [displaySrc, setDisplaySrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl;
    setLoading(true);
    setFailed(false);
    setDisplaySrc("");

    if (!src) {
      setLoading(false);
      setFailed(true);
      return undefined;
    }

    const imageUrl = String(src);
    const isProtectedImage = (() => {
      try {
        return new URL(imageUrl, window.location.origin).pathname.startsWith("/image/");
      } catch {
        return imageUrl.startsWith("/image/");
      }
    })();

    if (!isProtectedImage) {
      setDisplaySrc(imageUrl);
      setLoading(false);
      return undefined;
    }

    API.get(imageUrl, { responseType: "blob" })
      .then(({ data }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setDisplaySrc(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        onFail?.();
        setFailed(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (loading) return <span className="text-xs text-neutral-muted">Memuat gambar…</span>;
  if (failed) return <span className="text-xs text-neutral-muted">Gambar tidak dapat dimuat.</span>;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => {
        onFail?.();
        setFailed(true);
      }}
    />
  );
};

export default QuestionImage;
