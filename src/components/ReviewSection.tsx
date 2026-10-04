"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { type Review } from "@/lib/store";
import { fetchReviews, submitReview } from "@/lib/data.client";

export default function ReviewSection({ gymId }: { gymId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [writing, setWriting] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchReviews(gymId).then(setReviews);
  }, [gymId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(M2): 예약 이력 있는 유저만 작성 가능하게 제한
    await submitReview({ gymId, author: author.trim() || "익명", rating, text: text.trim() });
    setReviews(await fetchReviews(gymId));
    setWriting(false);
    setAuthor("");
    setRating(5);
    setText("");
  }

  return (
    <section className="mt-2 bg-white px-4 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold">
          리뷰 <span className="text-muted">{reviews.length}</span>
        </h2>
        <button onClick={() => setWriting((v) => !v)} className="text-[14px] font-semibold text-brand">
          {writing ? "취소" : "리뷰 쓰기"}
        </button>
      </div>

      {writing && (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-3 rounded-xl border border-line p-4">
          <div className="flex gap-1" role="radiogroup" aria-label="별점">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n === rating}
                aria-label={`${n}점`}
                onClick={() => setRating(n)}
                className="p-0.5"
              >
                <Star size={26} className={n <= rating ? "fill-star stroke-star" : "stroke-line"} />
              </button>
            ))}
          </div>
          <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="닉네임 (선택)" />
          <textarea
            className="input min-h-24 resize-none"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="체험은 어땠나요? 시설, 분위기, 코칭 스타일을 알려주세요."
          />
          <button type="submit" className="rounded-xl bg-brand py-3 text-[15px] font-bold text-white">
            등록
          </button>
        </form>
      )}

      <ul className="mt-2 divide-y divide-line">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold">{r.author}</p>
              <p className="text-[12px] text-muted">{r.date}</p>
            </div>
            <p className="mt-1 flex gap-0.5" aria-label={`${r.rating}점`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={13} className={n <= r.rating ? "fill-star stroke-star" : "stroke-line"} />
              ))}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/80">{r.text}</p>
          </li>
        ))}
      </ul>
      {reviews.length === 0 && !writing && (
        <p className="py-6 text-center text-[14px] text-muted">아직 리뷰가 없어요. 첫 리뷰를 남겨주세요.</p>
      )}
    </section>
  );
}
