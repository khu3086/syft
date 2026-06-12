"use client";

import { useState } from "react";

interface AvatarProps {
  name: string;
  photo?: string;
  /** Pixel diameter. */
  size: number;
  /** Fallback background when there's no photo (or it fails to load). */
  bg: string;
  fontSize?: number;
}

// Round avatar: shows the profile photo, falling back to the person's initial on
// a tinted circle when there's no photo or the image fails to load.
export function Avatar({ name, photo, size, bg, fontSize }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = photo && !failed;
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: bg, color: "var(--foreground)" }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: size, height: size, objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: fontSize ?? size * 0.4 }}>
          {name[0]}
        </span>
      )}
    </div>
  );
}
